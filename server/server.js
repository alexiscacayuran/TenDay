import express from "express";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import jwtAuth from "./route/jwtAuth.js";
import dashboard from "./route/dashboard.js";
import bodyParser from "body-parser";
import municitiesRoutes from "./controller/municities.js";
import filesRoutes from "./controller/files.js";
import windRoutes from "./controller/wind.js";
import temperatureRoutes from "./controller/temperature.js";
import rainfallRoutes from "./controller/rainfall.js";
import cloudCoverRoutes from "./controller/cloud_cover.js";
import humidityRoutes from "./controller/humidity.js";
import usersRouter from "./controller/users.js";
import authenticate from "./middleware/authorization.js";

// //Background job
// import "./backgroundJob/cleanUpDB.js"; // Runs cleanup job on startup

//API tenday (internal)
import { refactorData } from "./tenDayData/uploadTenDay.js";
import { processFiles } from "./tenDayData/tProcessTIF.js";
import { processWindFiles } from "./tenDayData/uploadWind.js";
//API tenday (external)
import getFullForecast from "./tenDayData/getFullForecast.js";
import getDateForecast from "./tenDayData/getDateForecast.js";
import getValidDate from "./tenDayData/getValidDate.js";
import getCurrentAllForecast from "./tenDayData/getCurrentAllForecast.js";
import getCurrentForecast from "./tenDayData/getCurrentForecast.js"; // Import the route

//API seasonal (internal)
import { processSeasonalData } from "./seasonalData/uploadSeasonal.js";
import { processSeasonalFiles } from "./seasonalData/sProcessTIF.js";

import seasonalDataRegional from "./seasonalData/seasonalRegional.js"; // Import the route

//API

import tokenRoutes from "./API/tokenRoutes.js";
import seasonalRoutes from "./API/seasonalRoutes.js";
const app = express();
const port = 5000;

// MIDDLEWARE:
app.use(express.json());
app.use(
  cors({
    origin: ["http://172.18.71.29:3000", "http://localhost:3000"],
  })
);
app.use(bodyParser.json());

// ROUTES:

app.get("/api/token", (req, res) => {
  res.json({ accessToken: process.env.A_TOKEN });
});

app.use("/auth", jwtAuth);

// Route for dashboard
app.use("/dashboard", dashboard);

// Route to handle data retrieval
app.use("/api/files", filesRoutes);

// Route for municities
app.use("/api/municities", municitiesRoutes);

// Route for municities
app.use("/api/wind", windRoutes);

// Route for municities
app.use("/api/temperature", temperatureRoutes);

// Route for municities
app.use("/api/rainfall", rainfallRoutes);

// Route for municities
app.use("/api/cloud_cover", cloudCoverRoutes);

// Route for municities
app.use("/api/humidity", humidityRoutes);

app.use("/users", usersRouter);

// Route for fetching current forecast for a certain municities
app.use("/", getCurrentForecast);

// Route for fetching current forecast
app.use("/", getCurrentAllForecast);

// Route for fetching current date
app.use("/date", getDateForecast);

// Route for fetching full forecast
app.use("/full", getFullForecast);

// Route for getting the latest date
app.use("/valid", getValidDate);

// Route for uploading Ten Day Data
app.get("/refactor-data", authenticate, async (req, res) => {
  const { year, month, day } = req.query;

  // Validate input
  if (!year || !month || !day) {
    return res
      .status(400)
      .json({ error: "Please provide Year, Month, and Day." });
  }

  try {
    const userId = req.user; // Extract the user ID from the authenticated user
    console.log("Authenticated User ID:", userId);

    const result = await refactorData(year, month, parseInt(day), userId); // Pass user ID to refactorData
    if (result.message.startsWith("Error:")) {
      return res.status(400).json({ error: result.message });
    }
    res.json({ message: result.message });
  } catch (error) {
    console.error("Error in /refactor-data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/process-files", async (req, res) => {
  const { year, month, day } = req.query;

  if (!year || !month || !day) {
    return res
      .status(400)
      .send("Error: Missing required parameters (year, month, day)");
  }

  try {
    // Wait for processing to finish before sending the response
    const result = await processFiles(year, month, day);

    return res.status(200).send(result); // Example: "100/100 files uploaded"
  } catch (error) {
    console.error("❌ Error processing files:", error);
    return res.status(500).send("Error processing files");
  }
});

// Route for uploading Seasonal Data
app.get("/seasonal-date", authenticate, async (req, res) => {
  try {
    const userId = req.user; // Extract the user ID from the authenticated user
    console.log("Authenticated User ID:", userId);

    const batch = req.query.batch;
    if (!batch) {
      return res.status(400).send("Batch is required.");
    }

    // Construct folder path
    const startYear = 2025 + Math.floor((batch - 180) / 12);
    const startMonth = getMonthName(batch);
    const folderPath = `\\\\10.10.3.118\\climps\\Seasonal_forecasts\\${batch}_${startMonth}${startYear}`;

    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      return res.status(404).send(`No folder found for batch ${batch}`);
    }

    // Process seasonal data
    await processSeasonalData(batch, folderPath, userId); // Pass userID to track the user
    res.send("Seasonal data processed successfully.");
  } catch (error) {
    console.error("Error processing seasonal data:", error);
    res.status(500).send("Error processing seasonal data.");
  }
});

// Helper function to get month name based on batch number
function getMonthName(batch) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[(batch - 180) % 12];
}

// Route for uploading Wind Data
app.get("/getWind", async (req, res) => {
  try {
    const { year, month, day } = req.query;

    if (!year || !month || !day) {
      return res
        .status(400)
        .json({ error: "Missing year, month, or day parameter" });
    }

    await processWindFiles(year, month, day);
    res.json({ message: "Wind files processed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Endpoint to Process TIF files (Seasonal)
app.get("/seasonalprocess", async (req, res) => {
  try {
    const batch = parseInt(req.query.batch, 10);
    if (isNaN(batch) || batch < 180) {
      return res.status(400).json({ error: "Invalid batch number" });
    }

    const result = await processSeasonalFiles(batch);
    res.json({ message: "Processing completed", result });
  } catch (error) {
    console.error("Error processing TIFF files:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Use API routes
app.use("/api", tokenRoutes);
app.use("/api", seasonalRoutes);

app.use("/seasonal-reg", seasonalDataRegional);

// Start the server
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
