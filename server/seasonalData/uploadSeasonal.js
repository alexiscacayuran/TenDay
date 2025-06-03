import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import moment from 'moment';
import { pool, redisClient } from "../db.js";
import { Router } from 'express';

const router = Router();

export const processSeasonalData = async (batch, folderPath, userId) => {
  const fileName = path.basename(folderPath); // e.g., "180_Jan2025"
  const startMonthName = getMonthName(batch); // Jan
  const startYear = 2025 + Math.floor((batch - 180) / 12);

  // Forecast starts one month after the folder name's month
  let forecastStart = moment(`${startYear}-${getMonthIndex(startMonthName)}-01`).add(1, 'month');

  const logDate = moment().format('YYYY-MM-DD HH:mm:ss');
  const client = await pool.connect();

  try {
    // Parse prov_mm.csv
    const forecastData = await parseCSV(path.join(folderPath, 'prov_mm.csv'));

    for (let row of forecastData) {
      const provinceId = await getProvinceId(row.PROVINCE);
      let currentDate = forecastStart.clone();

      for (let i = 1; i <= 6; i++) {
        const dateStr = currentDate.format('YYYY-MM-DD');

        // Check for existing sf_date
        let dateRes = await client.query(
          `SELECT id FROM sf_date WHERE date = $1 AND province_id = $2`,
          [dateStr, provinceId]
        );

        let dateId;
        if (dateRes.rowCount > 0) {
          dateId = dateRes.rows[0].id;

          // Update sf_date
          await client.query(
            `UPDATE sf_date SET start_month = $1, start_year = $2, batch = $3 WHERE id = $4`,
            [startMonthName, startYear, batch, dateId]
          );

          // Update forecast_rf
          await client.query(
            `UPDATE forecast_rf SET min = $1, mean = $2, max = $3 WHERE date_id = $4`,
            [row[`MIN${i}`], row[`MEAN${i}`], row[`MAX${i}`], dateId]
          );
        } else {
          // Insert new sf_date and forecast_rf
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

    // Parse prov_pn.csv
    const percentData = await parseCSV(path.join(folderPath, 'prov_pn.csv'));

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
          console.warn(`No sf_date found for ${dateStr}, skipping percent_n.`);
        }

        currentDate.add(1, 'month');
      }
    }

    // Log activity
    const status = 'Not Applicable';
    await client.query(
      `INSERT INTO activity_log (file_name, logdate, user_id, status, forecast)
       VALUES ('prov_mm_${batch}.csv', $1, $2, $3, $4)`,
      [logDate, userId, status, 'Seasonal Forecast']
    );
    await client.query(
      `INSERT INTO activity_log (file_name, logdate, user_id, status, forecast)
       VALUES ('prov_pn_${batch}.csv', $1, $2, $3, $4)`,
      [logDate, userId, status, 'Seasonal Forecast']
    );

    // Clear Redis cache
    const keys = await redisClient.keys('SEASONAL:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log('Redis cache cleared for seasonal data');
    }

    console.log(`Activity logged for batch ${batch}`);

  } catch (err) {
    console.error('Error processing seasonal data:', err);
    throw err;
  } finally {
    client.release();
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
  if (result.rows.length === 0) throw new Error(`Province not found: ${province}`);
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
