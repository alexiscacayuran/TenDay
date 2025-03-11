import pg from "pg";
import Redis from "ioredis";
import moment from "moment";

const { Pool } = pg;

// PostgreSQL Connection
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "admin",
  database: "ten_day",
  port: 5432,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis Connection
const redis = new Redis(); // Defaults to localhost:6379

const formatNumber = (value, roundToInt = false) => {
  if (value === null || value === undefined) return "NULL";
  return roundToInt ? Math.round(value) : parseFloat(value, 10);
};

const logBatchActivity = async (client, batch, userID) => {
  const fileName = batch.fileName;
  const logDate = moment().format("YYYY-MM-DD HH:mm:ss");

  const status =
    (await client.query(`SELECT id FROM date WHERE date = $1`, [batch.date]))
      .rowCount === 0
      ? "new"
      : "modified";

  const fileExistsRes = await client.query(
    `SELECT 1 FROM activity_log WHERE file_name = $1`,
    [fileName]
  );

  if (fileExistsRes.rowCount === 0) {
    await client.query(
      `INSERT INTO activity_log (file_name, logdate, user_id, status, forecast)
       VALUES ($1, $2, $3, $4, $5)`,
      [fileName, logDate, userID, status, "Ten Day"]
    );
  }
};

const getMunicityMap = async (client) => {
  let cachedMunicities = await redis.get("municities_map");

  if (cachedMunicities) {
    return new Map(JSON.parse(cachedMunicities));
  }

  const municityQuery = `
    SELECT id, LOWER(TRIM(municity)) AS municity, LOWER(TRIM(province)) AS province 
    FROM municities
  `;
  const municityMap = new Map(
    (await client.query(municityQuery)).rows.map((row) => [
      `${row.municity}-${row.province}`,
      row.id,
    ])
  );

  await redis.set(
    "municities_map",
    JSON.stringify([...municityMap]),
    "EX",
    86400
  ); // Cache for 1 day

  return municityMap;
};

const getExistingDates = async (client, batchDate) => {
  let cachedDates = await redis.get(`existing_dates_${batchDate}`);

  if (cachedDates) {
    return new Map(JSON.parse(cachedDates));
  }

  const dateQuery = `SELECT id, date, municity_id FROM date WHERE date = $1`;
  const existingDates = new Map(
    (await client.query(dateQuery, [batchDate])).rows.map((row) => [
      `${row.municity_id}-${batchDate}`,
      row.id,
    ])
  );

  await redis.set(
    `existing_dates_${batchDate}`,
    JSON.stringify([...existingDates]),
    "EX",
    86400
  ); // Cache for 1 day

  return existingDates;
};

export const uploadBatchToDB = async (batch, userID) => {
  console.log("Received userID:", userID);
  const client = await pool.connect();
  let successfullyInserted = 0;
  const missedRows = [];

  try {
    await client.query("BEGIN");

    await logBatchActivity(client, batch, userID);

    // Load cached municities & dates
    const municityMap = await getMunicityMap(client);
    let existingDates = await getExistingDates(client, batch.date);

    // Prepare bulk insert arrays
    const dateInsertValues = [];
    const weatherInsertValues = {
      cloud: [],
      humidity: [],
      rainfall: [],
      temp: [],
      wind: [],
    };

    for (const record of batch.data) {
      const {
        municity,
        province,
        cloud_cover,
        humidity,
        rainfall,
        temperature,
        wind,
      } = record;
      const key = `${municity.trim().toLowerCase()}-${province
        .trim()
        .toLowerCase()}`;
      const municityId = municityMap.get(key);

      if (!municityId) {
        missedRows.push(record);
        continue;
      }

      let dateId = existingDates.get(`${municityId}-${batch.date}`);
      if (!dateId) {
        // Insert new date and retrieve ID
        const newDateRes = await client.query(
          `INSERT INTO date (date, start_date, municity_id) VALUES ($1, $2, $3) RETURNING id`,
          [batch.date, batch.start_date, municityId]
        );
        dateId = newDateRes.rows[0].id;
        existingDates.set(`${municityId}-${batch.date}`, dateId);
      } else {
        // Update the start_date for existing records
        await client.query(`UPDATE date SET start_date = $1 WHERE id = $2`, [
          batch.start_date,
          dateId,
        ]);
      }

      // Check if dateId is valid before pushing values
      if (!dateId) {
        console.error(
          `Error: Missing dateId for municity '${municity}' in province '${province}'`
        );
        missedRows.push(record);
        continue;
      }

      weatherInsertValues.cloud.push(
        `('${cloud_cover.description}', ${dateId})`
      );
      weatherInsertValues.humidity.push(
        `(${formatNumber(humidity.mean, true)}, ${dateId})`
      );
      weatherInsertValues.rainfall.push(
        `('${rainfall.description}', ${rainfall.total}, ${dateId})`
      );
      weatherInsertValues.temp.push(
        `(${formatNumber(temperature.mean)}, ${formatNumber(
          temperature.min
        )}, ${formatNumber(temperature.max)}, ${dateId})`
      );
      weatherInsertValues.wind.push(
        `(${formatNumber(wind.speed)}, '${wind.direction}', ${dateId})`
      );
    }

    // Function to perform batch inserts and update existing rows when there's a conflict
    const bulkInsert = async (table, columns, values) => {
      if (values.length > 0) {
        const res = await client.query(
          `INSERT INTO ${table} (${columns}) 
          VALUES ${values.join(", ")} 
          ON CONFLICT (date_id) 
          DO UPDATE SET ${columns
            .split(", ")
            .map((col, i) => `${col} = EXCLUDED.${col}`)
            .join(", ")} 
          RETURNING *`
        );
        successfullyInserted += res.rowCount;
      }
    };

    await bulkInsert(
      "cloud_cover",
      "description, date_id",
      weatherInsertValues.cloud
    );
    await bulkInsert("humidity", "mean, date_id", weatherInsertValues.humidity);
    await bulkInsert(
      "rainfall",
      "description, total, date_id",
      weatherInsertValues.rainfall
    );
    await bulkInsert(
      "temperature",
      "mean, min, max, date_id",
      weatherInsertValues.temp
    );
    await bulkInsert(
      "wind",
      "speed, direction, date_id",
      weatherInsertValues.wind
    );

    await client.query("COMMIT");
    console.log("Batch uploaded successfully.");

    // Clear Redis cache after successful upload
    await redis.flushall();
    console.log("Redis cache cleared.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error uploading batch:", error);
    throw error;
  } finally {
    client.release();
  }

  console.log(`Successfully inserted ${successfullyInserted} rows.`);
  console.log(`Missed rows:`, missedRows);
};
