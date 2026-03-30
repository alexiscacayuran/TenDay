import express from "express";
import fs from "fs";
import cors from "cors";
import jwtAuth from "./route/jwtAuth.js";
import dashboard from "./route/dashboard.js";
import reportPage from "./route/report.js";
import tokenPage from "./route/token.js";
import dashboardAdmin from "./route/dashboardAdmin.js";
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
import getTokenRoute from "./API/serverToken.js";
import archiver from "archiver";
import moment from "moment";
import bcrypt from "bcrypt";
import crypto from "crypto";

//Ports
import authRoutes from "./API/token.js";
import { port } from "./config.js";
import { pool } from "./db.js";
import { logApiRequest } from "./middleware/logMiddleware.js";
import { authFileMiddleware } from "./middleware/authFileMiddleware.js";

// Chart
import pieChart from "./route/pieChart.js";
import barChart from "./route/barChart.js";
import cityChart from "./route/cityChart.js";
import countryChart from "./route/countryChart.js";

// Background job
import "./backgroundJob/cleanUpDB.js";
import "./backgroundJob/cleanUpS3.js";

//API tenday (internal)
import { uploadForecastData } from "./tenDayData/uploadTenDay.js";
import { uploadForecastTIF } from "./tenDayData/tProcessTIF.js";
import { uploadForecastTIF_orig } from "./tenDayData/tProcessTIF_orig.js";
import { uploadForecastXLSX } from "./tenDayData/tProcessXLSX.js";
import {
  retrieveForecastFile,
  streamForecastFile,
} from "./retrieveFile/tenDay.js";

import {
  retrieveSeasonalFile,
  streamSeasonalFile,
} from "./retrieveFile/seasonal.js";

import {
  retrieveCeramFiles,
  streamCeramFile,
} from "./retrieveFile/ceram.js";

//import { processWindFiles } from "./tenDayData/uploadWind.js";
import { uploadForecastWind } from "./tenDayData/uploadWind.js";

//API tenday (external)
import getFullForecast from "./tenDayData/getFullForecast.js";
import getDateForecast from "./tenDayData/getDateForecast.js";
import getValidDate from "./tenDayData/getValidDate.js";
import getCurrentAllForecast from "./tenDayData/getCurrentAllForecast.js";
import getCurrentForecast from "./tenDayData/getCurrentForecast.js"; // Import the route

import getFullForecastInternal from "./tenDayData/internal/getFullForecast.js";
import getDateForecastInternal from "./tenDayData/internal/getDateForecast.js";
import getMunicities from "./tenDayData/internal/getMunicities.js";
import getLocation from "./tenDayData/getLocation.js";

import analyticsRoutes from "./analytics.js";

import markSolvedRoute from "./API/markSolved.js";
import listTokenRoute from "./API/apiToken.js";
import ipAddressRoutes from "./API/ipAddress.js";
import createTokenRoute from "./API/createToken.js";

//API seasonal (internal)
import { processSeasonalData } from "./seasonalData/uploadSeasonal.js";
import { processSeasonalFiles } from "./seasonalData/sProcessTIF.js";

import regionalDataRoute from "./seasonalData/regional.js";
import provinceDataRoute from "./seasonalData/province.js";
import seasonalValidRoute from "./seasonalData/valid.js";

//API

import tokenRoutes from "./API/tokenRoutes.js";

//APILogs
import apiLogsRouter from './API/logs.js';

//activateToken
import activateTokenRoute from "./API/activate.js";

//Admin
import apiOrg from "./admin/apiOrg.js";

//CERAM
import { uploadCeramCSV } from "./ceram/uploadCSV.js";
import { getCeramData } from "./ceram/getCeram.js";
import ceramRoute from "./ceram/ceram.js";

//Extemes
import { uploadTIF } from "./ceram/uploadTIF.js";

//Health Check
import { checkWebsiteStatus } from "./backgroundJob/healthCheck.js";

//Upload Check
import checkValidRouter from "./admin/checkValid.js";

import { DateTime } from "luxon";

//EASITOOL
import genLink from './admin/genLink.js';
import presignedLinkRoutes from './admin/presignedlink.js';
import formStatusRoutes from './admin/formStatus.js';

//Report
import report from "./report/postFeedback.js";
import getFeedbackRouter from "./report/getFeedback.js";

//ENV
import envTokenRoutes from './admin/env.js';

//stations
import stationsRouter from "./synopagro/stations.js";

//normals
import { uploadNormals } from './synopagro/uploadNormals.js';
import climateNormals from './synopagro/climateNormals.js';

const SECRET_KEY = process.env.jwtSecret;

//tokenChecker
function makeTokenHash(rawToken) {
  return crypto.createHmac("sha256", SECRET_KEY).update(rawToken).digest("hex");
}

function normalizeApiIds(api_ids) {
  if (Array.isArray(api_ids)) {
    // already an array, ensure all numbers
    return api_ids.map(Number).filter(Number.isFinite);
  }
  if (typeof api_ids === "string") {
    // postgres might return "{5,10,11}" string
    return api_ids
      .replace(/[{}]/g, "")
      .split(",")
      .map(s => Number(s.trim()))
      .filter(Number.isFinite);
  }
  return [];
}

// Show time in Manila
const manilaTime = DateTime.now()
  .setZone("Asia/Manila")
  .toFormat("yyyy-MM-dd HH:mm:ss");
console.log("🇵🇭 Manila Time:", manilaTime);

// Show UTC time
const utcTime = DateTime.utc().toFormat("yyyy-MM-dd HH:mm:ss");
console.log("🌐 UTC Time:", utcTime);

const app = express();
app.set("trust proxy", true);

// MIDDLEWARE:
app.use(express.json());
app.use(
  cors({
    origin: ["http://172.18.71.29:8080", "http://localhost:8080", "https://tenday.pagasa.dost.gov.ph", "http://54.179.175.67"],
  })
);
app.use(bodyParser.json());

//app.use(express.json());
//app.use(cors());

// ROUTES:
app.use("/serverToken", getTokenRoute);
app.use("/api", activateTokenRoute);

//EASITOOL
app.use('/api/', genLink);
app.use('/api/presigned-links', presignedLinkRoutes);
app.use('/api/form-status', formStatusRoutes);

app.use("/api/auth", authRoutes); // Token API

app.get("/api/token", (req, res) => {
  res.json({ accessToken: process.env.A_TOKEN });
});

// OS env
app.use('/api/env-token', envTokenRoutes);

app.use("/auth", jwtAuth);

//Mark Solved
app.use("/api", markSolvedRoute);

app.use("/api", listTokenRoute);
app.use("/api", ipAddressRoutes);
app.use("/api", createTokenRoute);


// PieChart
app.use("/api", pieChart);

// BarChart
app.use("/api", barChart);

// CityChart
app.use("/api", cityChart);

// CountryChart
app.use("/api", countryChart);

// Route for dashboard
app.use("/api/dashboard", dashboard);
app.use("/api/token", tokenPage);

//report
app.use("/api/report", reportPage);
app.use("/api", getFeedbackRouter);

// Route for dashboard
app.use("/api/dashboardAdmin", dashboardAdmin);

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
app.use("/api/v1", getCurrentForecast);

// Route for fetching current forecast
app.use("/", getCurrentAllForecast);

// Route for fetching current date
app.use("/api/v1", getDateForecast);

// Route for fetching full forecast
app.use("/api/v1", getFullForecast);

// Route for getting the latest date
app.use("/api/v1", getValidDate);

// Route for fetching current date - internal
app.use("/dateinternal", getDateForecastInternal);

// Route for fetching full date - internal
app.use("/fullInternal", getFullForecastInternal);

// Route for fetching municities - internal
app.use("/municitiesInternal", getMunicities);

// Route for fetching location
app.use("/api/v1/", getLocation);

app.use("/api/", checkValidRouter);

//Analytics
app.use("/api", analyticsRoutes);

//Stations
app.use("/api/stations", stationsRouter);

//Normals
app.use("/api/uploadNormals", uploadNormals);
app.use("/apic", climateNormals);

// Route for uploading Ten Day Data
app.get("/api/uploadForecastData", authenticate, async (req, res) => {
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

    const result = await uploadForecastData(year, month, parseInt(day), userId); // Pass user ID to uploadForecastData
    if (result.message.startsWith("Error:")) {
      return res.status(400).json({ error: result.message });
    }
    res.json({ message: result.message });
  } catch (error) {
    console.error("Error in /uploadForecastData:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/uploadForecastTIF", authenticate, async (req, res) => {
  const { year, month, day } = req.query;

  if (!year || !month || !day) {
    return res
      .status(400)
      .send("Error: Missing required parameters (year, month, day)");
  }

  try {
    // Wait for processing to finish before sending the response
    const result = await uploadForecastTIF(year, month, day);
    return res.status(200).send(result);
  } catch (error) {
    console.error("❌ Error processing files:", error);
    return res.status(500).send("Error processing files");
  }
});

app.get("/api/uploadForecastTIF-orig", authenticate, async (req, res) => {
  const { year, month, day } = req.query;

  if (!year || !month || !day) {
    return res
      .status(400)
      .send("Error: Missing required parameters (year, month, day)");
  }

  try {
    const result = await uploadForecastTIF_orig(year, month, day);
    return res.status(200).send(result);
  } catch (error) {
    console.error("❌ Error processing files:", error);
    return res.status(500).send("Error processing files");
  }
});

app.get("/api/uploadForecastXLSX", authenticate, async (req, res) => {
  const { year, month, day } = req.query;

  if (!year || !month || !day) {
    return res
      .status(400)
      .send("Error: Missing required parameters (year, month, day)");
  }

  try {
    const result = await uploadForecastXLSX(year, month, day);
    return res.status(200).send(result);
  } catch (error) {
    console.error("❌ Error processing files:", error);
    return res.status(500).send("Error processing files");
  }
});


// ================== TEN-DAY FORECAST ==================
app.get("/api/v1/file/tenday", async (req, res) => {
  const { issuance_date, file, offset, masked, target } = req.query;

  if (!issuance_date || !file)
    return res.status(400).send("Missing parameters");

  if (!/^\d{8}$/.test(issuance_date))
    return res.status(400).send("Invalid date");

  try {
    await authFileMiddleware(req, 5);

    const year = issuance_date.substring(0, 4);
    const month = issuance_date.substring(4, 6);
    const day = issuance_date.substring(6, 8);

    let files = await retrieveForecastFile(
      year,
      month,
      day,
      file,
      offset,
      masked,
      target
    );

    if (!files || files.length === 0)
      return res.status(404).send("No files found");

    // ✅ Only return _orig files EXCEPT when file = XLSX
    if (file.toUpperCase() !== "XLSX") {
      files = files.filter(f => /_orig\./i.test(f.file));
    }

    if (files.length === 0)
      return res.status(404).send("No matching files found");

    const zipFilename = `${file.toUpperCase()}_${target || issuance_date}.zip`;

    const request_no = await logApiRequest(req, 5);

    if (files.length === 1 && file !== "all")
      return res.redirect(files[0].url);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const f of files) {
      const stream = await streamForecastFile(f.key);
      archive.append(stream, { name: f.file });
    }

    await archive.finalize();

  } catch (err) {
    console.error(err);
    res.status(err.status || 500).send(err.message || "Internal Server Error");
  }
});

// ================== SEASONAL FORECAST ==================
app.get("/api/v1/file/seasonal", async (req, res) => {
  const { batch, value } = req.query;
  if (!batch || !value) return res.status(400).send("Missing parameters");
  if (!/^\d{3}$/.test(batch)) return res.status(400).send("Invalid batch");

  try {
    await authFileMiddleware(req, 10);
    const files = await retrieveSeasonalFile(batch, value);
    if (!files || files.length === 0) return res.status(404).send("No files found");

    const zipFilename = `${value.toUpperCase()}_${batch}.zip`;
    const request_no = await logApiRequest(req, 10);

    if (files.length === 1 && value !== "all") return res.redirect(files[0].url);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const f of files) {
      const stream = await streamSeasonalFile(f.key);
      let subfolder = value === "pn" ? `PN_${batch}` : value === "mm" ? `MM_${batch}` : `ALL_${batch}`;
      archive.append(stream, { name: `${subfolder}/${f.file}` });
    }

    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).send(err.message || "Internal Server Error");
  }
});

// ================== CERAM ==================
app.get("/api/v1/file/ceram", async (req, res) => {
  const { climate_indicator, indicator_code, percentile, ssp } = req.query;
  if (!climate_indicator) return res.status(400).send("Missing climate_indicator");

  try {
    await authFileMiddleware(req, 11);
    const files = await retrieveCeramFiles(climate_indicator, indicator_code, percentile, ssp);
    if (!files || files.length === 0) return res.status(404).send("No files found");

    const timestamp = new Date().toISOString().replace(/[^\d]/g, "");
    const zipFilename = `CERAM_${climate_indicator}_${timestamp}.zip`;
    const request_no = await logApiRequest(req, 11);

    if (files.length === 1) return res.redirect(files[0].url);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const f of files) {
      const stream = await streamCeramFile(f.key);
      archive.append(stream, { name: f.file });
    }

    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).send(err.message || "Internal Server Error");
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
    //const folderPath = `\\\\10.10.3.118\\climps\\Seasonal_forecasts\\${batch}_${startMonth}${startYear}`;
    const folderPath = `/mnt/climps/Seasonal_forecasts/${batch}_${startMonth}${startYear}`;


    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      return res.status(404).send(`No folder found for batch ${batch}`);
    }

    // Process seasonal data
    await processSeasonalData(batch, folderPath, userId);
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
//app.get("/getWind", authenticate, async (req, res) => {
//  try {
//    const { year, month, day } = req.query;
//
//    if (!year || !month || !day) {
//      return res
//        .status(400)
//        .json({ error: "Missing year, month, or day parameter" });
//    }
//
//    const start = Date.now();
//    await processWindFiles(year, month, day);
//    const end = Date.now();
//
//    const duration = end - start;
//    const hours = Math.floor(duration / (1000 * 60 * 60));
//    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
//    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
//    const durationFormatted = `${String(hours).padStart(2, "0")}:${String(
//      minutes
//    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
//
//    const message = `Upload completed for ${year}-${month}-${day} in ${durationFormatted} (HH:MM:SS)`;
//    res.send(message); // <-- plain text instead of JSON
//  } catch (error) {
//    res
//      .status(500)
//      .json({ error: "Internal server error", details: error.message });
//  }
//});

// Route to upload forecast wind data
app.get("/api/uploadForecastWind", authenticate, async (req, res) => {
  const { year, month, day } = req.query;

  // Check if the required parameters are present
  if (!year || !month || !day) {
    return res.status(400).json({
      error: "Missing required parameters (year, month, day)",
    });
  }

  try {
    // Call the function to upload forecast wind
    const result = await uploadForecastWind(year, month, day);
    return res.status(200).json({
      message: "Successfully processed and uploaded forecast wind",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error processing files:", error);
    return res.status(500).json({
      error: "Error processing files",
      details: error.message,
    });
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

//API Logs
app.use(apiLogsRouter);

app.use("/api/v1/seasonal", regionalDataRoute);
app.use("/api/v1/seasonal", provinceDataRoute);
app.use("/api/v1/seasonal", seasonalValidRoute);

//Admin
app.use("/api", apiOrg);

//CERAM
app.get("/uploadCeramCSV", async (req, res) => {
  try {
    const result = await uploadCeramCSV();
    res.json({ message: result });
  } catch (error) {
    console.error("Error during CSV upload:", error);
    res.status(500).json({ error: "Failed to upload CSV files" });
  }
});

app.get("/api/get-ceram", authenticate, async (req, res) => {
  const userId = req.user;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  await getCeramData(userId, res);
});

app.use("/api/v1", ceramRoute);

//CERAM
app.get("/uploadExtremesTIF", async (req, res) => {
  try {
    const result = await uploadTIF();
    res.json({ message: result });
  } catch (error) {
    console.error("Error during TIF upload:", error);
    res.status(500).json({ error: "Failed to upload TIF files" });
  }
});

//HEALTH CHECK
app.get("/api/health", async (req, res) => {
  const isActive = await checkWebsiteStatus("https://tenday.pagasa.dost.gov.ph/");
  res.status(isActive ? 200 : 503).json({
    status: isActive ? "ACTIVE" : "OFFLINE",
  });
});

//REPORT
app.use("/api", report);

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on ${port}`);
});
