import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { pool } from '../db.js';

const SOURCE_PATH = '\\\\172.17.17.35\\iaas\\CERAM\\CMIP6\\CSV\\SSPs 126_245_585\\Province';

function extractProjectedValueAndChange(cellValue) {
  const match = cellValue.match(/^([\d.-]+)\s*\(([-\d.]+)[^)]*\)/);
  if (match) {
    return {
      projected_value: parseFloat(match[1]),
      change: parseFloat(match[2]),
    };
  }
  return { projected_value: null, change: null };
}

export async function getCeramData(userId, res) {
  const startTime = Date.now();
  let totalRows = 0;
  let filesCompleted = 0;

  try {
    const files = fs.readdirSync(SOURCE_PATH).filter(f => f.endsWith('.csv'));

    for (const file of files) {
      const filePath = path.join(SOURCE_PATH, file);
      const provinceName = path.parse(file).name;

      // Find province id
      const provinceQuery = await pool.query('SELECT id FROM province WHERE name = $1', [provinceName]);
      if (provinceQuery.rows.length === 0) {
        console.warn(`⚠️ Province not found for file: ${file}`);
        continue;
      }
      const province_id = provinceQuery.rows[0].id;

      // Check activity_log for this file & forecast CERAM
      const logCheck = await pool.query(
        'SELECT id FROM activity_log WHERE file_name = $1 AND forecast = $2',
        [file, 'CERAM']
      );

      if (logCheck.rows.length > 0) {
        // File already uploaded before - update status to modified
        await pool.query(
          'UPDATE activity_log SET status = $1, logdate = NOW(), user_id = $2 WHERE id = $3',
          ['modified', userId, logCheck.rows[0].id]
        );
        // Delete old data for this province to avoid duplicates
        await pool.query('DELETE FROM ceram WHERE province_id = $1', [province_id]);
      } else {
        // Insert new activity log entry
        await pool.query(
          'INSERT INTO activity_log (file_name, logdate, status, forecast, user_id) VALUES ($1, NOW(), $2, $3, $4)',
          [file, 'new', 'CERAM', userId]
        );
      }

      // Process CSV file & insert data
      await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath).pipe(csv());

        stream.on('data', async (row) => {
          try {
            const indicator_code = row.CODE;
            const observed_baseline = parseFloat(row.Observed_baseline);
            const range = row.Range;

            for (const [key, value] of Object.entries(row)) {
              if (key.startsWith('ssp')) {
                const match = key.match(/^ssp(\d+)_([\d]+)-([\d]+)$/);
                if (!match) continue;

                const scenario = match[1];
                const start_period = parseInt(match[2]);
                const end_period = parseInt(match[3]);

                const { projected_value, change } = extractProjectedValueAndChange(value);
                if (projected_value === null || change === null) continue;

                await pool.query(`
                  INSERT INTO ceram (
                    indicator_code, range, observed_baseline,
                    scenario, start_period, end_period,
                    projected_value, change, province_id
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                  indicator_code, range, observed_baseline,
                  scenario, start_period, end_period,
                  projected_value, change, province_id
                ]);

                totalRows++;
              }
            }
          } catch (err) {
            console.error('❌ Error processing row:', err.message);
          }
        });

        stream.on('end', () => {
          filesCompleted++;
          console.log(`✅ File processed: ${file}`);
          resolve();
        });

        stream.on('error', reject);
      });
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const durationFormatted = new Date(duration).toISOString().substr(11, 8); // HH:MM:SS

    console.log(`\n👍👍👍 Upload completed files no of successfully ${filesCompleted}/${files.length} in ${durationFormatted} (HH:MM:SS) 👍👍👍\n`);

    res.json({
      message: 'CERAM data imported successfully.',
      filesCompleted,
      totalRows,
      duration: durationFormatted
    });

  } catch (err) {
    console.error('❌ Import failed:', err);
    res.status(500).json({ error: 'Failed to import CERAM data.' });
  }
}
