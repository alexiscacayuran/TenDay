import express from "express";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import dayjs from "dayjs";

const router = express.Router();

const client = new BetaAnalyticsDataClient({
  keyFilename: "./tenDayAnalytics.json", // Your service account key
});

const propertyId = "properties/484898570";

const getCityData = async (startDate, endDate) => {
  const [response] = await client.runReport({
    property: propertyId,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "city" }],
    metrics: [{ name: "activeUsers" }],
    limit: 10000,
  });

  const cityData = {};

  response.rows?.forEach(row => {
    let city = row.dimensionValues[0].value || "Unknown";
    if (city.toLowerCase() === "(not set)") city = "Others";
    const sessions = parseInt(row.metricValues[0].value, 10) || 0;
    cityData[city] = (cityData[city] || 0) + sessions;
  });

  return cityData;
};

router.get("/cityChart", async (req, res) => {
  try {
    const today = dayjs().format("YYYY-MM-DD");
    const startOfWeek = dayjs().startOf("week").format("YYYY-MM-DD");
    const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
    const allTimeStart = "2020-01-01"; // Adjust based on GA4 setup

    const [daily, weekly, monthly, allTime] = await Promise.all([
      getCityData(today, today),
      getCityData(startOfWeek, today),
      getCityData(startOfMonth, today),
      getCityData(allTimeStart, today),
    ]);

    const allCities = new Set([
      ...Object.keys(daily),
      ...Object.keys(weekly),
      ...Object.keys(monthly),
      ...Object.keys(allTime),
    ]);

    const results = Array.from(allCities).map(city => ({
      city,
      daily_count: daily[city] || 0,
      weekly_count: weekly[city] || 0,
      monthly_count: monthly[city] || 0,
      all_time_count: allTime[city] || 0,
    }));

    res.json({ data: results });
  } catch (error) {
    console.error("Error fetching GA city analytics:", error);
    res.status(500).json({ error: "Failed to fetch city analytics" });
  }
});

export default router;
