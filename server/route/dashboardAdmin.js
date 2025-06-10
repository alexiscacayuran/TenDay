import { Router } from "express";
import { pool } from "../db.js";
import authorization from "../middleware/authorization.js";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const router = Router();

const propertyId = "484898570";

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: "./tenDayAnalytics.json",
});

router.post("/", authorization, async (req, res) => {
  try {
    // Run DB queries in parallel
    const [userRes, ownerRes, userSystem] = await Promise.all([
      pool.query("SELECT name FROM users WHERE user_id = $1;", [req.user]),
      pool.query("SELECT owner_type FROM users WHERE user_id = $1;", [req.user]),
      pool.query("SELECT COUNT(*) AS sysusers FROM users;")
    ]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name } = userRes.rows[0];
    const { owner_type } = ownerRes.rows[0];
    const { sysusers } = userSystem.rows[0];

    // Run GA API calls in parallel
    const [
      [dailyReport],
      [platformReport],
      [realtimeReport]
    ] = await Promise.all([
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [{ name: "activeUsers" }]
      }),

      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "today", endDate: "today" }],
        dimensions: [{ name: "platform" }, { name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }]
      }),

      analyticsDataClient.runRealtimeReport({
        property: `properties/${propertyId}`,
        dimensions: [{ name: "country" }, { name: "city" }],
        metrics: [{ name: "activeUsers" }]
      })
    ]);

    const dailyvisit = dailyReport.rows?.[0]?.metricValues?.[0]?.value || "0";

    const platformData = { Desktop: 0, Tablet: 0, Mobile: 0 };
    platformReport.rows?.forEach(row => {
      const platformDim = row.dimensionValues[0]?.value?.toLowerCase() || "";
      const deviceDim = row.dimensionValues[1]?.value?.toLowerCase() || "";
      const combined = `${platformDim} / ${deviceDim}`;
      const count = parseInt(row.metricValues[0].value, 10) || 0;

      if (combined === "web / desktop") platformData.Desktop += count;
      else if (combined === "web / tablet") platformData.Tablet += count;
      else if (combined === "web / mobile") platformData.Mobile += count;
    });

    const activeUsersTotal = (realtimeReport.rows || []).reduce((sum, row) => {
      return sum + (parseInt(row.metricValues[0].value, 10) || 0);
    }, 0);
    const active = activeUsersTotal.toString();

    console.log("✔ Dashboard Admin Data for:", name);
    console.log({ owner_type, sysusers, dailyvisit, platformData, active });

    res.json({
      name,
      owner: owner_type,
      userSystem: parseInt(sysusers, 10),
      dailyvisit,
      platformData,
      active
    });
  } catch (err) {
    console.error("Dashboard Admin Error:", err.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

export default router;
