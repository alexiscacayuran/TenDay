import express from "express";
import axios from "axios";
import cors from "cors";
import multer from "multer";
import { importCsvToDatabase } from "./route/csvImport.js";
import jwtAuth from "./route/jwtAuth.js";
import dashboard from "./route/dashboard.js";
import pool from "./db.js";

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

// Multer setup for file uploads
const upload = multer({
  dest: "route/",
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB limit per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv") {
      cb(null, true);
    } else {
      cb(new multer.MulterError("Unexpected file type"), false);
    }
  },
});

// ROUTES:

app.get("/current", async (req, res) => {
  const { municity, province } = req.query;

  // Get current date (assuming now is needed)
  const now = new Date().toISOString().split("T")[0];

  try {
    const query = `
        SELECT 
        m.id AS location_id, 
        m.municity, 
        m.province, 
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
      INNER JOIN rainfall AS r ON d.id = r.date_id 
      INNER JOIN cloud_cover AS c ON d.id = c.date_id 
      INNER JOIN temperature AS t ON d.id = t.date_id 
      INNER JOIN humidity AS h ON d.id = h.date_id 
      INNER JOIN wind AS w ON d.id = w.date_id 
      WHERE
        ($1::TEXT IS NOT NULL AND $1::TEXT <> '' OR $2::TEXT IS NOT NULL AND $2::TEXT <> '')
        AND
        REGEXP_REPLACE(m.municity, ' CITY', '', 'gi') ILIKE '%' || REGEXP_REPLACE($1, ' CITY', '', 'gi') || '%' 
        AND 
        m.province ILIKE '%' || $2 || '%' 
        AND d.date = $3 
      ORDER BY 
        d.start_date DESC 
      LIMIT 1
`;
    const values = [municity, province, now];

    // Execute the query
    const result = await pool.query(query, values);

    // If no results found, return an empty response
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Format data if municity and province were provided (single forecast)
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

    return res.json(data);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/current-all", async (req, res) => {
  const { municity, province } = req.query;

  // Get current date (assuming now is needed)
  const now = new Date().toISOString().split("T")[0];

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
        WHERE d.date = $1
        ORDER BY d.start_date DESC`;
    const values = [now];

    // Execute the query
    const result = await pool.query(query, values);

    // If no results found, return an empty response
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No data found" });
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
          UPPER(m.municity) = UPPER($1) 
          AND UPPER(m.province) = UPPER($2)
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
        humidity: forecast.humidity,
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

// Route for CSV upload and database import
app.post("/route/upload-csv", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded.");
  }

  try {
    const messages = [];
    for (const file of req.files) {
      const message = await importCsvToDatabase(file.path);
      messages.push(message);
    }
    res.status(200).send(messages);
  } catch (error) {
    console.error("Error during CSV import:", error);
    res.status(500).send("Failed to import CSV.");
  }
});

// Route for registration
app.use("/auth", jwtAuth);

// Route for dashboard
app.use("/dashboard", dashboard);

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
