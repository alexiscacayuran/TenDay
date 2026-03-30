// demo.js

// Import required modules
import express from "express";      // For creating the web server
import fetch from "node-fetch";     // For making HTTP requests to external APIs

const app = express();              // Initialize the Express app
const PORT = 5001;                  // Define the port your server will run on

// PAGASA API token for authentication (replace with your own token)
const PAGASA_API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb24iOiJIb3BlIiwiZW1haWwiOiJ0ZW5kYXkucGFnYXNhQGdtYWlsLmNvbSIsImFwaV9pZHMiOlsxXSwiaWF0IjoxNzUzMjAxMjQ1fQ.sT_s49iE9ooP3lK98qc1qcT7tL0WMt3OSuxRPGP81MA";

// Route: Serves the homepage with HTML content
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Current Weather: Sorsogon City</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f9f9f9;
          padding: 2rem;
        }
        .container {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 2rem;
          max-width: 600px;
          margin: 0 auto;
        }
        h2 {
          margin-top: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🌦️ Sorsogon City Weather Today</h2>
        <p id="message">Loading forecast...</p>
      </div>

      <script>
        // Call backend API to get the current forecast
        fetch("/api/demo")
          .then(res => res.json())
          .then(data => {
            // Get today’s date
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            // Extract rainfall value from response
            const rainfall = data?.data?.rainfall_total;

            // Determine the weather condition based on rainfall amount
            let condition = "unknown weather";
            if (rainfall === 0) {
              condition = "clear skies";
            } else if (rainfall <= 2.5) {
              condition = "light rain";
            } else if (rainfall <= 7.5) {
              condition = "moderate rain";
            } else if (rainfall <= 50) {
              condition = "heavy rain";
            } else if (rainfall > 50) {
              condition = "very heavy rain or stormy";
            }

            // Display the weather message in the page
            document.getElementById("message").textContent =
              "Hello! Today is " + dateStr + ". " +
              "The current forecast for Sorsogon City, Sorsogon suggests " + condition +
              " with approximately " + rainfall + " mm of rainfall.";
          })
          .catch(error => {
            // If there’s an error fetching the data
            console.error("Error loading forecast:", error);
            document.getElementById("message").textContent =
              "Sorry, we couldn't load the forecast right now.";
          });
      </script>
    </body>
    </html>
  `);
});

// Route: Backend API that fetches forecast data from TenDay API
app.get("/api/demo", async (req, res) => {
  try {
    // PAGASA endpoint with PSGC codes for Sorsogon province and city
    const url = "https://tenday.pagasa.dost.gov.ph/api/v1/tenday/current?province=0506200000&municity=0506216000";

    // Make the API request with the token
    const response = await fetch(url, {
      headers: {
        token: PAGASA_API_TOKEN,
      },
    });

    // Convert the response to JSON
    const data = await response.json();

    // Send the data to the frontend
    res.json(data);
  } catch (err) {
    // If error occurs, return 500 response
    console.error("Error fetching forecast:", err.message);
    res.status(500).json({
      error: "Unable to retrieve forecast",
      message: err.message
    });
  }
});

// Start the server and listen on defined port
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:\${PORT}`);
});
