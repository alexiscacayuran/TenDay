import express from "express";
import { pool } from "../db.js";
import Fuse from "fuse.js";

const router = express.Router();

let stationsList = [];

try {
  const result = await pool.query(`
    SELECT stn_code, station, type, lat, long, elev, admin_reg
    FROM stations
  `);
  stationsList = result.rows;
  console.log(`✅ Loaded ${stationsList.length} stations for fuzzy search.`);
} catch (error) {
  console.error("❌ Error loading stations:", error);
}

router.get("/", async (req, res) => {
  const { stn_code, station, type, region } = req.query;

  try {
    if (!stn_code && !station && !type && !region) {
      const allStations = await pool.query(`
        SELECT stn_code, station, type, lat, long, elev, admin_reg
        FROM stations
      `);
      return res.json(allStations.rows);
    }

    let baseQuery = `SELECT * FROM stations WHERE 1=1`;
    const values = [];
    let idx = 1;

    if (stn_code) {
      baseQuery += ` AND stn_code = $${idx++}`;
      values.push(stn_code);
    }

    if (type) {
      baseQuery += ` AND LOWER(type) LIKE $${idx++}`;
      values.push(`%${type.toLowerCase()}%`);
    }

    if (region) {
      baseQuery += ` AND LOWER(admin_reg) LIKE $${idx++}`;
      values.push(`%${region.toLowerCase()}%`);
    }

    const dbResult = await pool.query(baseQuery, values);
    let filteredRows = dbResult.rows;

    if (station) {
      const fuse = new Fuse(filteredRows, {
        keys: ["station"],
        threshold: 0.4,
        distance: 20,
        isCaseSensitive: false,
        includeScore: true,
        ignoreDiacritics: true,
      });

      const results = fuse.search(station);
      if (results.length === 0) {
        return res.status(404).json({ message: "No station match found with given filters." });
      }

      filteredRows = results.map(r => r.item);
    }

    if (filteredRows.length === 0) {
      return res.status(404).json({ message: "No stations found with given filters." });
    }

    return res.json(filteredRows);

  } catch (error) {
    console.error("❌ Error retrieving station data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
