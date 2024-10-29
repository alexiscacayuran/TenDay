import express from "express";
import pg from "pg";
import axios from "axios";
import env from "dotenv";
import cors from "cors";

const app = express();
const port = 5000;
env.config();

const { Pool } = pg;
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

app.use(cors());

app.get("/current", async (req, res) => {
  const { municity, province } = req.query;

  // Get current date (assuming now is needed)
  const now = new Date().toISOString().split("T")[0];

  try {
    let query;
    let values = [];

    // If municity and province are provided, use the WHERE clause
    if (municity && province) {
      query = `
        SELECT 
          m.id AS location_id, m.municity, m.province, 
          d.id AS date_id, 
          d.date,
          d.start_date,
          r.description as rainfall, 
          c.description as cloud_cover, 
          t.mean, t.min, t.max, 
          h.mean as humidity, 
          w.speed, w.direction 
        FROM 
          municities AS m 
        INNER JOIN date AS d ON m.id = d.municity_id 
        INNER JOIN rainfall as r ON d.id = r.date_id 
        INNER JOIN cloud_cover as c ON d.id = c.date_id 
        INNER JOIN temperature as t ON d.id = t.date_id 
        INNER JOIN humidity as h ON d.id = h.date_id 
        INNER JOIN wind as w ON d.id = w.date_id 
        WHERE 
          m.municity = $1 
          AND m.province = $2 
          AND d.date = $3 
        ORDER BY 
          d.start_date DESC 
        LIMIT 1`;
      values = [municity, province, now];
    } else {
      // If no municity or province is provided, query all forecasts without filtering
      query = `
        SELECT 
          m.id AS location_id, m.municity, m.province, 
          d.id AS date_id, d.date, d.start_date, 
          r.description as rainfall, 
          c.description as cloud_cover, 
          t.mean, t.min, t.max, 
          h.mean as humidity, 
          w.speed, w.direction 
        FROM 
          municities AS m 
        INNER JOIN date AS d ON m.id = d.municity_id 
        INNER JOIN rainfall as r ON d.id = r.date_id 
        INNER JOIN cloud_cover as c ON d.id = c.date_id 
        INNER JOIN temperature as t ON d.id = t.date_id 
        INNER JOIN humidity as h ON d.id = h.date_id 
        INNER JOIN wind as w ON d.id = w.date_id 
        WHERE d.date = $1
        ORDER BY d.start_date DESC`;
      values = [now]; // Only the date is needed when no municity or province is provided
    }

    // Execute the query
    const result = await pool.query(query, values);

    // If no results found, return an empty response
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Format data if municity and province were provided (single forecast)
    if (municity && province) {
      const {
        location_id,
        municity: _municity,
        province: _province,
        date_id,
        date,
        start_date,
        rainfall,
        cloud_cover,
        mean,
        min,
        max,
        humidity,
        speed,
        direction,
      } = result.rows[0];

      const data = {
        id: location_id,
        municity: _municity,
        province: _province,
        forecast: {
          forecast_id: date_id,
          date: date.toLocaleString("en-PH").split(", ")[0],
          start_date: start_date.toLocaleString("en-PH").split(", ")[0],
          rainfall: rainfall,
          cloud_cover: cloud_cover,
          temperature: {
            mean: mean,
            min: min,
            max: max,
          },
          humidity: humidity,
          wind: {
            speed: speed,
            direction: direction,
          },
        },
      };

      console.log(data.forecast.date);

      return res.json(data);
    }

    // Format data if no specific municity and province were provided (multiple forecasts)
    const data = result.rows.map((forecast) => ({
      id: forecast.location_id,
      municity: forecast.municity,
      province: forecast.province,
      forecast: {
        forecast_id: forecast.date_id,
        date: forecast.date.toLocaleString("en-PH").split(", ")[0],
        start_date: forecast.start_date.toLocaleString("en-PH").split(", ")[0],
        rainfall: forecast.rainfall,
        cloud_cover: forecast.cloud_cover,
        temperature: {
          mean: forecast.mean,
          min: forecast.min,
          max: forecast.max,
        },
        humidity: forecast.humidity,
        wind: {
          speed: forecast.speed,
          direction: forecast.direction,
        },
      },
    }));

    return res.json(data);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/full", async (req, res) => {
  const { municity, province } = req.query;

  try {
    const query = `
      SELECT 
        m.id AS location_id, m.municity, m.province, 
        d.id AS date_id, d.date, d.start_date, 
        r.description as rainfall, 
        c.description as cloud_cover, 
        t.mean, t.min, t.max, 
        h.mean as humidity, 
        w.speed, w.direction 
      FROM 
        municities AS m 
      INNER JOIN date AS d ON m.id = d.municity_id 
      INNER JOIN rainfall as r ON d.id = r.date_id 
      INNER JOIN cloud_cover as c ON d.id = c.date_id 
      INNER JOIN temperature as t ON d.id = t.date_id 
      INNER JOIN humidity as h ON d.id = h.date_id 
      INNER JOIN wind as w ON d.id = w.date_id 
      WHERE 
        m.municity = $1 
        AND m.province = $2 
      ORDER BY 
        d.start_date DESC, date ASC
      LIMIT 10`;
    const values = [municity, province];
    const result = await pool.query(query, values);

    const {
      location_id,
      municity: _municity,
      province: _province,
    } = result.rows[0];

    const data = {
      id: location_id,
      municity: _municity,
      province: _province,
      forecasts: result.rows.map((forecast) => ({
        forecast_id: forecast.date_id,
        date: forecast.date.toLocaleString("en-PH").split(", ")[0],
        start_date: forecast.start_date.toLocaleString("en-PH").split(", ")[0],
        rainfall: forecast.rainfall,
        cloud_cover: forecast.cloud_cover,
        temperature: {
          mean: forecast.mean,
          min: forecast.min,
          max: forecast.max,
        },
        huimidity: forecast.humidity,
        wind: {
          speed: forecast.speed,
          direction: forecast.direction,
        },
      })),
    };

    res.json(data);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
