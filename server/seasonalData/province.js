import express from "express";
import { pool, redisClient } from "../db.js";
import { format } from "date-fns";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

function sendErrorResponse({
  res,
  statusCode,
  message,
  req,
  page = 1,
  limit = 10,
  api_name = "Province Forecast",
  forecast = "Forecast",
  totalCount = 0,
  noPagination = false
}) {
  res.status(statusCode).json({
    metadata: {
      api: api_name,
      forecast
    },
    data: [],
    misc: {
      version: "1.0",
      timestamp: format(new Date(), "M/d/yyyy h:mm:ss a"),
      method: req.method,
      ...(noPagination ? {} : {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_count: totalCount,
        total_pages: Math.ceil(totalCount / limit)
      }),
      status_code: statusCode,
      description: message
    }
  });
}

router.get("/province", authenticateToken(9), async (req, res) => {
  const { province, value, page, limit = 10 } = req.query;
  const api_name = req.user?.api_name || "Province Forecast";
  const forecast_label = req.user?.forecast || "Forecast";

  await logApiRequest(req, 9);

  if (!value) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      message: "Missing required query parameter: value.",
      req,
      page,
      limit,
      api_name,
      forecast: forecast_label
    });
  }

  const isPageNone = page === "none";
  const pageNum = parseInt(page) || 1;
  const perPage = isPageNone ? null : parseInt(limit) || 10;
  const offset = isPageNone ? 0 : (pageNum - 1) * perPage;
  const cacheKey = `province:${province || "all"}:value:${value}:page:${page || "1"}:limit:${limit}`;

  try {
    // Check Redis cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.misc.timestamp = format(new Date(), "M/d/yyyy h:mm:ss a");
      return res.json(parsed);
    }

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
      provincesRes = isPageNone
        ? await pool.query("SELECT id, name, region FROM province ORDER BY name ASC")
        : await pool.query("SELECT id, name, region FROM province ORDER BY name ASC LIMIT $1 OFFSET $2", [perPage, offset]);
    }

    const provinces = provincesRes.rows;
    if (provinces.length === 0) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Bad Request: No provinces found.",
        req,
        page,
        limit,
        api_name,
        forecast: forecast_label,
        noPagination: isPageNone
      });
    }

    const provinceIds = provinces.map(p => p.id);

    const batchRes = await pool.query("SELECT MAX(batch) AS batch FROM sf_date");
    const maxBatch = batchRes.rows[0]?.batch;
    if (!maxBatch) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "No batch data found.",
        req,
        page,
        limit,
        api_name,
        forecast: forecast_label,
        noPagination: isPageNone
      });
    }

    const dateRes = await pool.query("SELECT MIN(date) AS date FROM sf_date WHERE batch = $1", [maxBatch]);
    const baseDate = new Date(dateRes.rows[0]?.date);
    if (!baseDate) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "Bad Reqauest: No date found for max batch.",
        req,
        page,
        limit,
        api_name,
        forecast: forecast_label,
        noPagination: isPageNone
      });
    }

    const issuanceDate = new Date(baseDate);
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

    const dateRows = sfRes.rows;
    if (dateRows.length === 0) {
      return sendErrorResponse({
        res,
        statusCode: 404,
        message: "No content: No forecast data found",
        req,
        page,
        limit,
        api_name,
        forecast: forecast_label,
        noPagination: isPageNone
      });
    }

    const provinceDateMap = {};
    for (let row of dateRows) {
      if (!provinceDateMap[row.province_id]) provinceDateMap[row.province_id] = [];
      provinceDateMap[row.province_id].push(row);
    }

    const issuance_month = format(issuanceDate, "MMMM yyyy");
    const start_month = format(new Date(targetDates[0]), "MMMM yyyy");
    const end_month = format(new Date(targetDates[5]), "MMMM yyyy");

    const rfMap = {};
    const pnMap = {};

    const allDateIds = dateRows.map(r => r.id);
    if (["mm", "all", "pn"].includes(value)) {
      const rfRes = await pool.query(
        "SELECT date_id, mean, min, max FROM forecast_rf WHERE date_id = ANY($1::int[])",
        [allDateIds]
      );
      rfRes.rows.forEach(r => { rfMap[r.date_id] = r });
    }

    if (["pn", "all"].includes(value)) {
      const pnRes = await pool.query(
        "SELECT date_id, mean, description FROM percent_n WHERE date_id = ANY($1::int[])",
        [allDateIds]
      );
      pnRes.rows.forEach(r => { pnMap[r.date_id] = r });
    }

    const resultData = [];

    for (let prov of provinces) {
      const pid = prov.id;
      const dateInfo = provinceDateMap[pid] || [];

      for (let { id: date_id, date } of dateInfo) {
        const rf = rfMap[date_id] || {};
        const pn = pnMap[date_id] || {};
        const entry = {
          province: prov.name,
          region: prov.region,
          month: format(new Date(date), "MMMM yyyy")
        };

        if (value === "mm") {
          entry.min_mm = rf.min ?? null;
          entry.max_mm = rf.max ?? null;
          entry.mean_mm = rf.mean ?? null;
        }

        if (value === "pn") {
          entry.mean_mm = rf.mean ?? null;
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

        resultData.push(entry);
      }
    }

    const response = {
      metadata: {
        api: api_name,
        forecast: forecast_label,
        issuance_month,
        start_month,
        end_month,
        ...(province ? { province: resultData[0].province, region: resultData[0].region } : {})
      },
      data: resultData,
      misc: {
        version: "1.0",
        timestamp: format(new Date(), "M/d/yyyy h:mm:ss a"),
        method: req.method,
        ...(isPageNone ? {} : {
          current_page: pageNum,
          per_page: parseInt(limit),
          total_count: totalCount,
          total_pages: Math.ceil(totalCount / limit)
        }),
        status_code: 200,
        description: "OK"
      }
    };

    // Cache it for 1 day
    await redisClient.setEx(cacheKey, 86400, JSON.stringify(response));

    res.json(response);
  } catch (err) {
    console.error("❌ Province API Error:", err);
    return sendErrorResponse({
      res,
      statusCode: 500,
      message: "Internal server error.",
      req,
      page,
      limit,
      api_name,
      forecast: forecast_label,
      noPagination: isPageNone
    });
  }
});

export default router;
