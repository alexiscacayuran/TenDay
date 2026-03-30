// getNormals.js
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import csvParser from 'csv-parser';
import multer from 'multer';
import {pool } from '../db.js';

// Multer config
const upload = multer({ dest: 'uploads/' });

// Parse start/end year from filename
function parseDatesFromFilename(filename) {
  const start_date = parseInt(filename.slice(0, 4), 10);
  const end_date = parseInt(filename.slice(-8, -4), 10);
  return { start_date, end_date };
}

// Read file data
async function readFileData(filePath, fileName) {
  if (fileName.endsWith('.xlsx')) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  } else if (fileName.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }
  throw new Error('Unsupported file format');
}

// Clean value
function cleanValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      trimmed === '' ||
      ['NULL', 'N/A', 'NA'].includes(trimmed.toUpperCase())
    ) return null;
    return isNaN(trimmed) ? trimmed : Number(trimmed);
  }
  return value;
}

// Bulk insert/update
async function insertOrUpdateRows(rows, start_date, end_date) {
  if (rows.length === 0) return;

  const values = [];
  const placeholders = [];

  rows.forEach((row, i) => {
    const idx = i * 20;
    placeholders.push(`(
      $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6},
      $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10}, $${idx + 11}, $${idx + 12}, $${idx + 13},
      $${idx + 14}, $${idx + 15}, $${idx + 16}, $${idx + 17}, $${idx + 18}, $${idx + 19}, $${idx + 20}
    )`);

    values.push(
      cleanValue(row['stn_code']),
      start_date,
      end_date,
      cleanValue(row['month']),
      cleanValue(row['r_amount']),
      cleanValue(row['r_days']),
      cleanValue(row['t_mean']),
      cleanValue(row['t_max']),
      cleanValue(row['t_min']),
      cleanValue(row['t_dbulb']),
      cleanValue(row['t_wbulb']),
      cleanValue(row['vapor_pressure']),
      cleanValue(row['rh_mslp'] || row['rh']),
      cleanValue(row['mslp']),
      cleanValue(row['w_dir']),
      cleanValue(row['w_spd']),
      cleanValue(row['cloud']),
      cleanValue(row['tstm']),
      cleanValue(row['ltng']),
      cleanValue(row['dew_point'])
    );
  });

  const query = `
    INSERT INTO normals (
      stn_code, start_date, end_date, month, r_amount, r_days,
      t_mean, t_max, t_min, t_dbulb, t_wbulb, vapor_pressure, rh,
      mslp, w_dir, w_spd, cloud, tstm, ltng, dew_point
    ) VALUES ${placeholders.join(',')}
    ON CONFLICT (stn_code, start_date, end_date, month)
    DO UPDATE SET
      r_amount = EXCLUDED.r_amount,
      r_days = EXCLUDED.r_days,
      t_mean = EXCLUDED.t_mean,
      t_max = EXCLUDED.t_max,
      t_min = EXCLUDED.t_min,
      t_dbulb = EXCLUDED.t_dbulb,
      t_wbulb = EXCLUDED.t_wbulb,
      vapor_pressure = EXCLUDED.vapor_pressure,
      rh = EXCLUDED.rh,
      mslp = EXCLUDED.mslp,
      w_dir = EXCLUDED.w_dir,
      w_spd = EXCLUDED.w_spd,
      cloud = EXCLUDED.cloud,
      tstm = EXCLUDED.tstm,
      ltng = EXCLUDED.ltng,
      dew_point = EXCLUDED.dew_point
  `;

  await pool.query(query, values);
}

// Express route
export const uploadNormals = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const filePath = req.file.path;
      const fileName = path.basename(req.file.originalname);

      const { start_date, end_date } = parseDatesFromFilename(fileName);
      const rows = await readFileData(filePath, fileName);

      await insertOrUpdateRows(rows, start_date, end_date);

      fs.unlinkSync(filePath);
      res.json({ message: '✅ File processed and inserted/updated successfully' });
    } catch (error) {
      console.error('❌ Error processing file:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
];
