import moment from "moment";
import { pool, ioredis as redis } from "../db.js";

const formatNumber = (value, roundToInt = false) => {
  if (value === null || value === undefined) return "NULL";
  return roundToInt ? Math.round(value) : parseFloat(value, 10);
};

const logBatchActivity = async (client, batch, userID) => {
  const fileName = batch.fileName;
  const logDate = moment.utc().add(8, 'hours').format("YYYY-MM-DD HH:mm:ss");

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
    (await client.query(municityQuery)).rows.map((row) => {
      const key = `${row.municity}-${row.province}`;
      return [key, row.id];
    })
  );
  await redis.set(
    "municities_map",
    JSON.stringify([...municityMap]),
    "EX",
    86400
  );
  return municityMap;
};

const getExistingDates = async (client, batchDate) => {
  const dateQuery = `SELECT id, date, municity_id FROM date WHERE date = $1`;
  return new Map(
    (await client.query(dateQuery, [batchDate])).rows.map((row) => [
      `${row.municity_id}-${batchDate}`,
      row.id,
    ])
  );
};

export const uploadBatchToDB = async (batch, userID) => {
  console.log("Received userID:", userID);
  const client = await pool.connect();

  let successfullyInserted = 0;
  const missedRows = [];

  // hold all weather values then chunk them afterwards
  const weatherInsertValues = {
    cloud: [],
    humidity: [],
    rainfall: [],
    temp: [],
    wind: [],
  };

  try {
    await logBatchActivity(client, batch, userID);

    const municityMap = await getMunicityMap(client);
    let existingDates = await getExistingDates(client, batch.date);

    for (const record of batch.data) {
      const { municity, province, cloud_cover, humidity, rainfall, temperature, wind } = record;
      const key = `${municity.trim().toLowerCase()}-${province.trim().toLowerCase()}`;
      const municityId = municityMap.get(key);

      if (!municityId) {
        missedRows.push({ ...record, reason: "Missing municityId" });
        continue;
      }

      let dateId = existingDates.get(`${municityId}-${batch.date}`);
      if (!dateId) {
        const newDateRes = await client.query(
          `INSERT INTO date (date, start_date, municity_id) VALUES ($1, $2, $3) RETURNING id`,
          [batch.date, batch.start_date, municityId]
        );
        dateId = newDateRes.rows[0].id;
        existingDates.set(`${municityId}-${batch.date}`, dateId);
      } else {
        await client.query(
          `UPDATE date SET start_date = $1 WHERE id = $2`,
          [batch.start_date, dateId]
        );
      }

      weatherInsertValues.cloud.push(`('${cloud_cover.description}', ${dateId})`);
      weatherInsertValues.humidity.push(`(${formatNumber(humidity.mean, true)}, ${dateId})`);
      weatherInsertValues.rainfall.push(`('${rainfall.description}', ${formatNumber(rainfall.total)}, ${dateId})`);
      weatherInsertValues.temp.push(`(${formatNumber(temperature.mean)}, ${formatNumber(temperature.min)}, ${formatNumber(temperature.max)}, ${dateId})`);
      weatherInsertValues.wind.push(`(${formatNumber(wind.speed)}, '${wind.direction}', ${dateId})`);
    }

    // Bulk insert in chunks of 500 rows per transaction
    const MAX_CHUNK = 500;
    const bulkInsertChunked = async (table, columns, values) => {
      for (let i = 0; i < values.length; i += MAX_CHUNK) {
        const chunk = values.slice(i, i + MAX_CHUNK);
        try {
          await client.query("BEGIN");
          const res = await client.query(
            `INSERT INTO ${table} (${columns})
             VALUES ${chunk.join(", ")}
             ON CONFLICT (date_id)
             DO UPDATE SET ${columns.split(", ").map((col) => `${col} = EXCLUDED.${col}`).join(", ")}
             RETURNING *`
          );
          successfullyInserted += res.rowCount;
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK");
          console.error(`Error inserting chunk into ${table}:`, err);
        }
      }
    };

    await bulkInsertChunked("cloud_cover", "description, date_id", weatherInsertValues.cloud);
    await bulkInsertChunked("humidity", "mean, date_id", weatherInsertValues.humidity);
    await bulkInsertChunked("rainfall", "description, total, date_id", weatherInsertValues.rainfall);
    await bulkInsertChunked("temperature", "mean, min, max, date_id", weatherInsertValues.temp);
    await bulkInsertChunked("wind", "speed, direction, date_id", weatherInsertValues.wind);

    console.log("Batch uploaded successfully.");
  } catch (error) {
    console.error("Error uploading batch:", error);
    throw error;
  } finally {
    client.release();
  }

  console.log(`Successfully inserted ${successfullyInserted} rows.`);
  console.log(`Missed rows:`, missedRows);
};
