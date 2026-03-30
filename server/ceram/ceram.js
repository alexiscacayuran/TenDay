import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";
import Fuse from "fuse.js";

const router = express.Router();

router.get("/projections/ceram", authenticateToken(8), async (req, res) => {
  let {
    province,
    indicator_code,
    range,
    observed_baseline,
    scenario,
    start_period,
    end_period,
    page,
    per_page
  } = req.query;

  const timestamp = new Date().toLocaleString("en-PH");
  const method = "GET";
  const defaultPerPage = 10;
  const isPageNone = page === "none";
  const currentPage = isPageNone ? 1 : parseInt(page) || 1;
  const limit = isPageNone ? null : parseInt(per_page) || defaultPerPage;

  const { api_ids } = req.user;

  if (!Array.isArray(api_ids) || !api_ids.includes(8)) {
    return res.status(403).json({
      metadata: {
        api: "CERAM",
        forecast: "Climate Extremes Risk Analysis Matrix"
      },
      data: [],
      misc: {
        version: "1.0",
        timestamp,
        method: "GET",
        ...(isPageNone ? {} : {
          current_page: currentPage,
          per_page: limit,
          total_count: 0,
          total_pages: 0,
        }),
        status_code: 403,
        description: "Forbidden: You are not authorized to access this API."
      }
    });
  }

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
      if (/^\d{9,10}$/.test(province)) {
        filters.push(`p.p_psgc = $${index++}`);
        values.push(province);
      } else {
        const provQuery = await pool.query(`SELECT id, name FROM province WHERE id < 84`);
        const allProvinces = provQuery.rows;

        const fuse = new Fuse(allProvinces, {
          keys: ['name'],
          location: 1,
          threshold: 0.4,
          distance: 30,
          isCaseSensitive: false,
          includeScore: true,
          ignoreDiacritics: true,
        });

        const fuzzyMatch = fuse.search(province)?.[0]?.item;

        if (fuzzyMatch) {
          filters.push(`p.id = $${index++}`);
          values.push(fuzzyMatch.id);
        } else {
          return res.status(404).json({
            metadata: {
              api: "CERAM",
              forecast: "Climate Extremes Risk Analysis Matrix"
            },
            data: [],
            misc: {
              version: "1.0",
              timestamp,
              method,
              status_code: 404,
              description: "Bad Request: No provinces found."
            }
          });
        }
      }
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

    const countQuery = `SELECT COUNT(*) ${baseQuery}`;
    const countResult = await pool.query(countQuery, values);
    const total_count = parseInt(countResult.rows[0].count);
    const total_pages = isPageNone ? 1 : Math.ceil(total_count / limit);
    const offset = isPageNone ? 0 : (currentPage - 1) * limit;

    const dataQuery = `
      SELECT c.*, p.name AS province, p.region
      ${baseQuery}
      ORDER BY
      p.name ASC,
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
      ${isPageNone ? "" : `LIMIT $${index++} OFFSET $${index++}`}
    `;

    const dataValues = [...values];
    if (!isPageNone) {
      dataValues.push(limit, offset);
    }

    const dataResult = await pool.query(dataQuery, dataValues);

    if (dataResult.rows.length === 0) {
      await logApiRequest(req, 8);
      return res.status(404).json({
        metadata: { api: "CERAM", forecast: "Climate Extremes Risk Analysis Matrix" },
        data: [],
        misc: {
          version: "1.0",
          timestamp,
          method,
          ...(isPageNone ? {} : {
            current_page: currentPage,
            per_page: limit,
            total_count: 0,
            total_pages: 0,
          }),
          status_code: 404,
          description: "Not Found"
        }
      });
    }

    let finalData;
    let provinceName, regionName;

    if (province) {
      // Flattened data without province and region in each item
      finalData = dataResult.rows.map(row => ({
        indicator_code: row.indicator_code,
        observed_baseline: parseFloat(row.observed_baseline),
        range: row.range,
        scenario: row.scenario,
        start_period: row.start_period,
        end_period: row.end_period,
        projected_value: parseFloat(row.projected_value),
        change: parseFloat(row.change)
      }));

      // Assume province + region are same for all rows (since filtered)
      provinceName = dataResult.rows[0].province;
      regionName = dataResult.rows[0].region;
    } else {
      // Include province and region in each data item
      finalData = dataResult.rows.map(row => ({
        province: row.province,
        region: row.region,
        indicator_code: row.indicator_code,
        observed_baseline: parseFloat(row.observed_baseline),
        range: row.range,
        scenario: row.scenario,
        start_period: row.start_period,
        end_period: row.end_period,
        projected_value: parseFloat(row.projected_value),
        change: parseFloat(row.change)
      }));
    }

    const metadata = {
      api: "CERAM",
      forecast: "Climate Extremes Risk Analysis Matrix"
    };
    
    if (province && provinceName && regionName) {
      metadata.province = provinceName;
      metadata.region = regionName;
    }

    const response = {
      metadata,
      data: finalData,
      misc: isPageNone ? {
        version: "1.0",
        timestamp,
        method,
        status_code: 200,
        description: "OK"
      } : {
        version: "1.0",
        timestamp,
        method,
        current_page: currentPage,
        per_page: limit,
        total_count,
        total_pages,
        status_code: 200,
        description: "OK"
      }
    };
    

    await logApiRequest(req, 8);
    return res.status(200).json(response);

  } catch (error) {
    console.error("❌ CERAM error:", error);
    return res.status(500).json({
      metadata: { api: "CERAM", forecast: "Climate Extremes Risk Analysis Matrix" },
      data: [],
      misc: {
        version: "1.0",
        timestamp: new Date().toLocaleString("en-PH"),
        method: "GET",
        status_code: 500,
        description: "Internal Server Error"
      }
    });
  }
});

export default router;
