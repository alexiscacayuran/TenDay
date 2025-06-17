import express from "express";
import { pool } from "../db.js";
import { format } from "date-fns";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

function sendErrorResponse({ res, statusCode, message, req, page = 1, limit = 10, api_name = "Province Forecast", forecast = "Forecast" }) {
  res.status(statusCode).json({
    metadata: {
      api: api_name,
      forecast: forecast
    },
    forecast: [],
    misc: {
      version: "1.0",
      timestamp: new Date().toISOString(),
      method: req.method,
      status_code: statusCode,
      description: message,
      current_page: parseInt(page),
      per_page: parseInt(limit),
      total_count: 0,
      total_pages: 0
    }
  });
}

router.get("/province", authenticateToken(9), async (req, res) => {
  const { province, value, batch, issuance_date, page = 1, limit = 10 } = req.query;
  const api_name = req.user?.api_name || "Province Forecast";
  const forecast_label = req.user?.forecast || "Forecast";

  await logApiRequest(req, 9);

  if (!value || (!batch && !issuance_date)) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Missing required query parameters: value, batch or issuance_date.",
      req,
      page,
      limit,
      api_name,
      forecast: forecast_label
    });
  }

  try {
    let provincesRes;
    let totalCount = 0;

    if (province) {
      provincesRes = await pool.query(
        "SELECT id, name, region FROM province WHERE LOWER(name) = LOWER($1)",
        [province]
      );
      totalCount = provincesRes.rows.length;
    } else {
      const countRes = await pool.query("SELECT COUNT(*) FROM province");
      totalCount = parseInt(countRes.rows[0].count);
      const offset = (page - 1) * limit;
      provincesRes = await pool.query(
        "SELECT id, name, region FROM province ORDER BY name ASC LIMIT $1 OFFSET $2",
        [limit, offset]
      );
    }

    const provinces = provincesRes.rows;
    if (provinces.length === 0) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "No provinces found.",
        req,
        page,
        limit,
        api_name,
        forecast: forecast_label
      });
    }

    const provinceIds = provinces.map(p => p.id);
    const provinceDateMap = {};
    let issuanceDate = new Date();
    let dateRows = [];

    if (batch) {
      const batchRes = await pool.query("SELECT MIN(date) as date FROM sf_date WHERE batch = $1", [batch]);
      if (!batchRes.rows[0] || !batchRes.rows[0].date) {
        return sendErrorResponse({
          res,
          statusCode: 404,
          message: "No records found for the specified batch.",
          req,
          page,
          limit,
          api_name,
          forecast: forecast_label
        });
      }

      const baseDate = new Date(batchRes.rows[0].date);
      issuanceDate = new Date(baseDate);
      issuanceDate.setMonth(issuanceDate.getMonth() - 1);

      const targetDates = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        d.setDate(1);
        targetDates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
      }

      const sfRes = await pool.query(
        `SELECT id, province_id, date 
         FROM sf_date 
         WHERE province_id = ANY($1::int[]) AND TO_CHAR(date, 'YYYY-MM-DD') = ANY($2::text[])
         ORDER BY date ASC`,
        [provinceIds, targetDates]
      );
      dateRows = sfRes.rows;
    }

    if (issuance_date) {
      const [month, year] = issuance_date.split("/").map(Number);
      issuanceDate = new Date(year, month - 1, 1);
      const baseDate = new Date(year, month - 1, 1);

      const dates = [];
      for (let i = 1; i <= 6; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
      }

      const sfRes = await pool.query(
        `SELECT id, province_id, date 
         FROM sf_date 
         WHERE date = ANY($1::date[]) AND province_id = ANY($2::int[]) 
         ORDER BY date ASC`,
        [dates, provinceIds]
      );
      dateRows = sfRes.rows;
    }

    if (dateRows.length === 0) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "No date records found.",
        req,
        page,
        limit,
        api_name,
        forecast: forecast_label
      });
    }

    for (let row of dateRows) {
      if (!provinceDateMap[row.province_id]) provinceDateMap[row.province_id] = [];
      provinceDateMap[row.province_id].push(row);
    }

    const issuance_month = format(issuanceDate, "MMMM yyyy");
    const forecastResults = [];

    for (let prov of provinces) {
      const pid = prov.id;
      const dateInfo = provinceDateMap[pid] || [];
      const dateIds = dateInfo.map(d => d.id);

      const rfMap = {};
      const pnMap = {};

      if (value === "mm" || value === "all") {
        const rfRes = await pool.query(
          "SELECT date_id, mean, min, max FROM forecast_rf WHERE date_id = ANY($1::int[])",
          [dateIds]
        );
        rfRes.rows.forEach(r => { rfMap[r.date_id] = r });
      }

      if (value === "pn" || value === "all") {
        const pnRes = await pool.query(
          "SELECT date_id, mean, description FROM percent_n WHERE date_id = ANY($1::int[])",
          [dateIds]
        );
        pnRes.rows.forEach(r => { pnMap[r.date_id] = r });
      }

      const dataArray = [];

      for (let { id: date_id, date } of dateInfo) {
        const rf = rfMap[date_id] || {};
        const pn = pnMap[date_id] || {};
        const entry = {
          month: format(new Date(date), "MMMM yyyy")
        };

        if (value === "mm") {
          entry.min_mm = rf.min ?? null;
          entry.max_mm = rf.max ?? null;
          entry.mean_mm = rf.mean ?? null;
        }

        if (value === "pn") {
          entry.percent_normal = pn.mean ?? null;
          entry.description = pn.description ?? null;
        }

        if (value === "all") {
          entry.min_mm = rf.min ?? null;
          entry.max_mm = rf.max ?? null;
          entry.mean_mm = rf.mean ?? null;
          entry.percent_normal = pn.mean ?? null;
          entry.description = pn.description ?? null;
        }

        dataArray.push(entry);
      }

      forecastResults.push({
        province: prov.name,
        region: prov.region,
        data: dataArray
      });
    }

    const response = {
      metadata: {
        api: api_name,
        forecast: forecast_label,
        issuance_month,
        ...(province ? {
          province: forecastResults[0].province,
          region: forecastResults[0].region
        } : {})
      },
      forecast: province ? forecastResults[0].data : forecastResults,
      ...(province ? {} : {
        misc: {
          version: "1.0",
          timestamp: new Date().toISOString(),
          method: req.method,
          status_code: 200,
          description: "OK",
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_count: totalCount,
          total_pages: Math.ceil(totalCount / limit)
        }
      })
    };
    

    res.json(response);
  } catch (err) {
    console.error(err);
    return sendErrorResponse({
      res,
      statusCode: 500,
      message: "Internal server error.",
      req,
      page,
      limit,
      api_name,
      forecast: forecast_label
    });
  }
});

export default router;
