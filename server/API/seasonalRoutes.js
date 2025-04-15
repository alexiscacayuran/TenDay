import express from 'express';
import { getSeasonal } from '../seasonalData/getSeasonal.js';
import { authenticateToken, rateLimit, logApiCall } from '../middleware/APIMiddleware.js';

const router = express.Router();

// ✅ Fetch Seasonal Data (Requires Authentication, Rate Limiting & Logs API Calls)
router.get('/get-seasonal', authenticateToken, rateLimit, logApiCall, async (req, res) => {
  const { provinceName, Month, Year } = req.query;

  if (!provinceName || !Month || !Year) {
    return res.status(400).json({
      api: "Get Seasonal Forecast",
      forecast: "Seasonal Forecast",
      start_date: "Invalid Request",
      version: 1,
      timestamp: new Date().toISOString(),
      status_code: 400,
      error: "Missing required query parameters",
      data: []
    });
  }

  try {
    const seasonalData = await getSeasonal(provinceName, parseInt(Month), parseInt(Year));

    // ✅ If no data is found, return metadata with 404 status
    if (seasonalData.data.length === 0) {
      seasonalData.status_code = 404;
      seasonalData.error = "No data found";
      return res.status(404).json(seasonalData);
    }

    // ✅ Send response with metadata and status code
    return res.status(200).json(seasonalData);
  } catch (error) {
    console.error('Error fetching seasonal data:', error);

    return res.status(500).json({
      api: "Get Seasonal Forecast",
      forecast: "Seasonal Forecast",
      start_date: "Error Occurred",
      version: 1,
      timestamp: new Date().toISOString(),
      status_code: 500,
      error: "Internal Server Error",
      data: []
    });
  }
});

export default router;
