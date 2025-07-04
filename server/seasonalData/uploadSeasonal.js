import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import moment from 'moment';
import { pool, redisClient } from "../db.js";
import { Router } from 'express';

const router = Router();

export const processSeasonalData = async (batch, folderPath, userId) => {
  const startTime = Date.now(); // ⏱️ Start timer
  const fileName = path.basename(folderPath); // e.g., "180_Jan2025"
  const startMonthName = getMonthName(batch); // Jan
  const startYear = 2025 + Math.floor((batch - 180) / 12);
  let forecastStart = moment(`${startYear}-${getMonthIndex(startMonthName)}-01`).add(1, 'month');
  const logDate = moment().format('YYYY-MM-DD HH:mm:ss');
  const client = await pool.connect();

  let mmStatus = "New";
  let pnStatus = "New";

  try {
    console.log(`📂 Processing folder: ${folderPath}`);
    const forecastData = await parseCSV(path.join(folderPath, 'prov_mm.csv'));
    console.log(`✅ prov_mm.csv parsed. Rows: ${forecastData.length}`);

    for (let row of forecastData) {
      const provinceId = await getProvinceId(row.PROVINCE);
      let currentDate = forecastStart.clone();

      for (let i = 1; i <= 6; i++) {
        const dateStr = currentDate.format('YYYY-MM-DD');

        let dateRes = await client.query(
          `SELECT id FROM sf_date WHERE date = $1 AND province_id = $2`,
          [dateStr, provinceId]
        );

        let dateId;
        if (dateRes.rowCount > 0) {
          mmStatus = "Modified";
          dateId = dateRes.rows[0].id;

          await client.query(
            `UPDATE sf_date SET start_month = $1, start_year = $2, batch = $3 WHERE id = $4`,
            [startMonthName, startYear, batch, dateId]
          );

          await client.query(
            `UPDATE forecast_rf SET min = $1, mean = $2, max = $3 WHERE date_id = $4`,
            [row[`MIN${i}`], row[`MEAN${i}`], row[`MAX${i}`], dateId]
          );
        } else {
          const newDateRes = await client.query(
            `INSERT INTO sf_date (date, start_month, start_year, batch, province_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [dateStr, startMonthName, startYear, batch, provinceId]
          );
          dateId = newDateRes.rows[0].id;

          await client.query(
            `INSERT INTO forecast_rf (date_id, min, mean, max)
             VALUES ($1, $2, $3, $4)`,
            [dateId, row[`MIN${i}`], row[`MEAN${i}`], row[`MAX${i}`]]
          );
        }

        currentDate.add(1, 'month');
      }
    }

    const percentData = await parseCSV(path.join(folderPath, 'prov_pn.csv'));
    console.log(`✅ prov_pn.csv parsed. Rows: ${percentData.length}`);

    for (let row of percentData) {
      const provinceId = await getProvinceId(row.PROVINCE);
      let currentDate = forecastStart.clone();

      for (let i = 1; i <= 6; i++) {
        const dateStr = currentDate.format('YYYY-MM-DD');

        const dateRes = await client.query(
          `SELECT id FROM sf_date WHERE date = $1 AND province_id = $2`,
          [dateStr, provinceId]
        );

        if (dateRes.rowCount > 0) {
          const dateId = dateRes.rows[0].id;

          const percentRes = await client.query(
            `SELECT 1 FROM percent_n WHERE date_id = $1`,
            [dateId]
          );

          if (percentRes.rowCount > 0) {
            pnStatus = "Modified";
            await client.query(
              `UPDATE percent_n SET mean = $1, description = $2 WHERE date_id = $3`,
              [row[`MEAN${i}`], getDescription(row[`MEAN${i}`]), dateId]
            );
          } else {
            await client.query(
              `INSERT INTO percent_n (date_id, mean, description)
               VALUES ($1, $2, $3)`,
              [dateId, row[`MEAN${i}`], getDescription(row[`MEAN${i}`])]
            );
          }
        } else {
          console.warn(`⚠️ No sf_date found for ${dateStr}, skipping percent_n.`);
        }

        currentDate.add(1, 'month');
      }
    }

    // 🔁 Log activity with UPSERT-style conflict handling
    const logActivity = async (filename, status) => {
      try {
        await client.query(
          `INSERT INTO activity_log (file_name, logdate, user_id, status, forecast)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (file_name)
           DO UPDATE SET logdate = EXCLUDED.logdate, user_id = EXCLUDED.user_id,
                         status = 'Modified', forecast = EXCLUDED.forecast`,
          [filename, logDate, userId, status, 'Seasonal Forecast']
        );
      } catch (err) {
        console.error(`❌ Error logging activity for ${filename}:`, err.message);
      }
    };

    await logActivity(`prov_mm_${batch}.csv`, mmStatus);
    await logActivity(`prov_pn_${batch}.csv`, pnStatus);

    // Clear Redis cache
    const keys = await redisClient.keys('SEASONAL:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log('♻️ Redis cache cleared for seasonal data.');
    }

    console.log(`✅ Activity logged. Batch: ${batch}`);
  } catch (err) {
    console.error('❌ Error processing seasonal data:', err);
    throw err;
  } finally {
    client.release();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ Total time: ${duration} seconds`);
  }
};

// 🔹 Helper Functions
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => data.push(row))
      .on('end', () => resolve(data))
      .on('error', reject);
  });
};

const getProvinceId = async (province) => {
  const result = await pool.query('SELECT id FROM province WHERE id = $1', [province]);
  if (result.rows.length === 0) throw new Error(`❌ Province not found: ${province}`);
  return result.rows[0].id;
};

const getDescription = (mean) => {
  if (mean <= 40) return 'Way Below Normal';
  if (mean <= 80) return 'Below Normal';
  if (mean <= 120) return 'Near Normal';
  if (mean <= 160) return 'Above Normal';
  return 'Way Above Normal';
};

const getMonthName = (batch) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[(batch - 180) % 12];
};

const getMonthIndex = (shortName) => {
  const months = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };
  return months[shortName];
};
