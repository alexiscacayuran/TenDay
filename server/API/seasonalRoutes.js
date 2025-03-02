import express from 'express';
import { getSeasonal } from '../seasonalData/getSeasonal.js';
import { authenticateToken, rateLimit, logApiCall } from '../middleware/APIMiddleware.js';

const router = express.Router();

// ✅ Fetch Seasonal Data (Requires Authentication, Rate Limiting & Logs API Calls)
router.get('/get-seasonal', authenticateToken, rateLimit, logApiCall, async (req, res) => {
  const { provinceName, Month, Year } = req.query;

  if (!provinceName || !Month || !Year) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  try {
    const seasonalData = await getSeasonal(provinceName, parseInt(Month), parseInt(Year));

    if (!seasonalData.length) {
      return res.status(404).json({ error: 'No data found' });
    }

    res.json(seasonalData);
  } catch (error) {
    console.error('Error fetching seasonal data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
