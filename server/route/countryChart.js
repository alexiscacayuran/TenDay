import express from "express";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import dayjs from "dayjs";

const router = express.Router();

const client = new BetaAnalyticsDataClient({
  keyFilename: "./tenDayAnalytics.json", // Your service account key
});

const propertyId = "properties/484898570";

const getcountryData = async (startDate, endDate) => {
  const [response] = await client.runReport({
    property: propertyId,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
    limit: 10000,
  });

  const countryData = {};

response.rows?.forEach(row => {
  let country = row.dimensionValues[0].value || "Unknown";
  if (country.toLowerCase() === "(not set)") country = "Others";

  const sessions = parseInt(row.metricValues[0].value, 10) || 0;
  countryData[country] = (countryData[country] || 0) + sessions;
});

return countryData;

};



router.get("/countryChart", async (req, res) => {
  try {
    const today = dayjs().format("YYYY-MM-DD");
    const startOfWeek = dayjs().startOf("week").format("YYYY-MM-DD");
    const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
    const allTimeStart = "2020-01-01"; // Adjust based on GA4 setup

    const [daily, weekly, monthly, allTime] = await Promise.all([
      getcountryData(today, today),
      getcountryData(startOfWeek, today),
      getcountryData(startOfMonth, today),
      getcountryData(allTimeStart, today),
    ]);

    const allCities = new Set([
      ...Object.keys(daily),
      ...Object.keys(weekly),
      ...Object.keys(monthly),
      ...Object.keys(allTime),
    ]);

    const results = Array.from(allCities).map(country => ({
      country,
      daily_count: daily[country] || 0,
      weekly_count: weekly[country] || 0,
      monthly_count: monthly[country] || 0,
      all_time_count: allTime[country] || 0,
    }));

    res.json({ data: results });
  } catch (error) {
    console.error("Error fetching GA country analytics:", error);
    res.status(500).json({ error: "Failed to fetch country analytics" });
  }
});

export default router;
