import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import moment from 'moment';
import { pool, redisClient } from "../db.js";
import { Router } from 'express';

const router = Router();

export const processSeasonalData = async (batch, folderPath, userId) => {
  const fileName = path.basename(folderPath); 
  const startMonth = getMonthName(batch);
  const startYear = 2025 + Math.floor((batch - 180) / 12);
  const logDate = moment().format('YYYY-MM-DD HH:mm:ss');

  const client = await pool.connect();

  try {
    // Process forecast data from prov_mm.csv
    const forecastData = await parseCSV(path.join(folderPath, 'prov_mm.csv'));
    for (let row of forecastData) {
      const provinceId = await getProvinceId(row.PROVINCE);
      let currentMonth = startMonth;

      for (let i = 1; i <= 6; i++) {
        const nextMonth = getNextMonth(currentMonth);

        // Check if sf_date exists
        let dateRes = await client.query(
          `SELECT id FROM sf_date WHERE month = $1 AND year = $2 AND province_id = $3`,
          [nextMonth, startYear, provinceId]
        );

        let dateId;
        if (dateRes.rowCount > 0) {
          dateId = dateRes.rows[0].id;

          // Update sf_date
          await client.query(
            `UPDATE sf_date SET start_month = $1, start_year = $2, batch = $3 WHERE id = $4`,
            [startMonth, startYear, batch, dateId]
          );

          // Update forecast_rf
          await client.query(
            `UPDATE forecast_rf SET min = $1, mean = $2, max = $3 WHERE date_id = $4`,
            [row[`MIN${i}`], row[`MEAN${i}`], row[`MAX${i}`], dateId]
          );
        } else {
          // Insert new sf_date
          const newDateRes = await client.query(
            `INSERT INTO sf_date (month, year, start_month, start_year, batch, province_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [nextMonth, startYear, startMonth, startYear, batch, provinceId]
          );
          dateId = newDateRes.rows[0].id;

          // Insert new forecast_rf
          await client.query(
            `INSERT INTO forecast_rf (date_id, min, mean, max)
             VALUES ($1, $2, $3, $4)`,
            [dateId, row[`MIN${i}`], row[`MEAN${i}`], row[`MAX${i}`]]
          );
        }

        currentMonth = nextMonth;
      }
    }

    // Process percent_n data from prov_pn.csv
    const percentData = await parseCSV(path.join(folderPath, 'prov_pn.csv'));
    for (let row of percentData) {
      const provinceId = await getProvinceId(row.PROVINCE);
      let currentMonth = startMonth;

      for (let i = 1; i <= 6; i++) {
        const nextMonth = getNextMonth(currentMonth);

        // Fetch `sf_date.id`
        let dateRes = await client.query(
          `SELECT id FROM sf_date WHERE month = $1 AND year = $2 AND province_id = $3`,
          [nextMonth, startYear, provinceId]
        );

        let dateId;
        if (dateRes.rowCount > 0) {
          dateId = dateRes.rows[0].id;

          // Check if percent_n already exists
          const percentRes = await client.query(
            `SELECT 1 FROM percent_n WHERE date_id = $1`,
            [dateId]
          );

          if (percentRes.rowCount > 0) {
            // Update existing record
            await client.query(
              `UPDATE percent_n SET mean = $1, description = $2 WHERE date_id = $3`,
              [row[`MEAN${i}`], getDescription(row[`MEAN${i}`]), dateId]
            );
          } else {
            // Insert new record
            await client.query(
              `INSERT INTO percent_n (date_id, mean, description)
               VALUES ($1, $2, $3)`,
              [dateId, row[`MEAN${i}`], getDescription(row[`MEAN${i}`])]
            );
          }
        } else {
          console.warn(`No sf_date entry found for ${nextMonth} ${startYear}, skipping percent_n insert.`);
        }

        currentMonth = nextMonth;
      }
    }

    // Logging Activity for both prov_mm.csv and prov_pn.csv
    const status = 'Not Applicable';  // Updated status

    // Log activity for prov_mm.csv
    await client.query(
      `INSERT INTO activity_log (file_name, logdate, user_id, status, forecast)
       VALUES ('prov_mm_${batch}.csv', $1, $2, $3, $4)`,
      [logDate, userId, status, 'Seasonal Forecast']
    );

    // Log activity for prov_pn.csv
    await client.query(
      `INSERT INTO activity_log (file_name, logdate, user_id, status, forecast)
       VALUES ('prov_pn_${batch}.csv', $1, $2, $3, $4)`,
      [logDate, userId, status, 'Seasonal Forecast']
    );

    // Clear only seasonal keys in Redis
    const keys = await redisClient.keys('SEASONAL:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log('Redis cache cleared for seasonal data');
    }
    
    console.log(`Activity logged for prov_mm_${batch}.csv and prov_pn_${batch}.csv`);
    

  } catch (err) {
    console.error('Error processing seasonal data:', err);
    throw err;
  } finally {
    client.release();
  }
};

// 📌 **Helper Functions**
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

const getNextMonth = (currentMonth) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[(months.indexOf(currentMonth) + 1) % 12];
};
