import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

router.get("/ceram", authenticateToken(8), async (req, res) => {
  const {
    province,
    indicator_code,
    range,
    observed_baseline,
    scenario,
    start_period,
    end_period,
    page = 1,
    per_page = 10,
  } = req.query;

  try {
    const filters = [];
    const values = [];
    let index = 1;

    let baseQuery = `
      FROM ceram c
      JOIN province p ON c.province_id = p.id
      WHERE 1=1
    `;

    if (province) {
      filters.push(`p.name ILIKE $${index++}`);
      values.push(province);
    }
    if (indicator_code) {
      filters.push(`c.indicator_code = $${index++}`);
      values.push(indicator_code);
    }
    if (range) {
      filters.push(`c.range = $${index++}`);
      values.push(range);
    }
    if (observed_baseline) {
      filters.push(`c.observed_baseline = $${index++}`);
      values.push(observed_baseline);
    }
    if (scenario) {
      filters.push(`c.scenario = $${index++}`);
      values.push(scenario);
    }
    if (start_period) {
      filters.push(`c.start_period = $${index++}`);
      values.push(start_period);
    }
    if (end_period) {
      filters.push(`c.end_period = $${index++}`);
      values.push(end_period);
    }

    if (filters.length > 0) {
      baseQuery += " AND " + filters.join(" AND ");
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;
    const countResult = await pool.query(countQuery, values);
    const total_count = parseInt(countResult.rows[0].count);
    const total_pages = Math.ceil(total_count / per_page);
    const offset = (page - 1) * per_page;

    // Get paginated data
    const dataQuery = `
    SELECT c.*, p.name AS province
    ${baseQuery}
    ORDER BY
        CASE c.indicator_code
        WHEN 'TNn' THEN 1
        WHEN 'TNm' THEN 2
        WHEN 'TNx' THEN 3
        WHEN 'TXn' THEN 4
        WHEN 'TXm' THEN 5
        WHEN 'TXx' THEN 6
        WHEN 'RX1day' THEN 7
        WHEN 'RX5day' THEN 8
        ELSE 999
        END,
        c.indicator_code,
        c.range DESC,
        c.id
    LIMIT $${index++} OFFSET $${index++}
    `;

    const dataValues = [...values, per_page, offset];
    const dataResult = await pool.query(dataQuery, dataValues);

    if (dataResult.rows.length === 0) {
      await logApiRequest(req, 8); // ✅ Log not-found request too
      return res.status(404).json({
        metadata: { api: "CERAM" },
        data: [],
        misc: {
          version: "1.0",
          total_count: 0,
          total_pages: 0,
          current_page: parseInt(page),
          per_page: parseInt(per_page),
          timestamp: new Date().toLocaleString("en-PH"),
          method: "GET",
          status_code: 404,
          description: "Not Found"
        }
      });
    }

    const provinceName = dataResult.rows[0].province;

    const response = {
      metadata: {
        api: "CERAM"
      },
      data: {
        province: provinceName,
        indicators: Object.values(
          dataResult.rows.reduce((acc, row) => {
            const key = row.indicator_code;
            if (!acc[key]) {
              acc[key] = {
                indicator_code: row.indicator_code,
                observed_baseline: parseFloat(row.observed_baseline),
                ranges: {}
              };
            }

            if (!acc[key].ranges[row.range]) {
              acc[key].ranges[row.range] = [];
            }

            acc[key].ranges[row.range].push({
              scenario: row.scenario,
              start_period: row.start_period,
              end_period: row.end_period,
              projected_value: parseFloat(row.projected_value),
              change: parseFloat(row.change)
            });

            return acc;
          }, {})
        ).map(indicator => ({
          ...indicator,
          ranges: Object.entries(indicator.ranges).map(([range, values]) => ({
            range,
            values
          }))
        }))
      },
      misc: {
        version: "1.0",
        total_count,
        total_pages,
        current_page: parseInt(page),
        per_page: parseInt(per_page),
        timestamp: new Date().toLocaleString("en-PH"),
        method: "GET",
        status_code: 200,
        description: "OK"
      }
    };

    await logApiRequest(req, 8); // ✅ Log successful request

    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ Error retrieving CERAM data:", error);
    return res.status(501).json({
      metadata: { api: "CERAM" },
      data: [],
      misc: {
        version: "1.0",
        total_count: 0,
        total_pages: 0,
        current_page: parseInt(page),
        per_page: parseInt(per_page),
        timestamp: new Date().toLocaleString("en-PH"),
        method: "GET",
        status_code: 501,
        description: "Internal Server Error"
      }
    });
  }
});

export default router;
