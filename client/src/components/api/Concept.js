// Concept.js

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useInView } from "react-intersection-observer";

const concepts = [
  {
    label: "Authentication",
    content: (
      <>
        <Typography fontWeight="bold" mb={1} sx={{fontFamily: "Commissioner"}}>
          All requests to the API must include a valid token:
        </Typography>
        <SyntaxHighlighter language="json" style={vscDarkPlus}>
          {`"token": "YOUR_API_TOKEN"`}
        </SyntaxHighlighter>
        <Typography mt={2} sx={{fontFamily: "Commissioner"}}>
          Tokens are tied to specific users and must be kept secure. Tokens can
          be revoked at any time due to misuse or violation of terms.
        </Typography>
      </>
    ),
  },
  {
    label: "Rate Limit",
    content: (
      <>
        <Typography mb={2} sx={{fontFamily: "Commissioner"}}>
          To ensure fair and stable access for all users, the TenDay Weather
          Forecast API enforces the following usage limits per registered API
          token:
        </Typography>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Limit Type</strong></TableCell>
                <TableCell><strong>Rule</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Burst Limit</TableCell>
                <TableCell>
                  Maximum of 100 consecutive requests per token
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cooldown Period</TableCell>
                <TableCell>
                  A 60-second cooling time is enforced after hitting the burst
                  limit
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Daily Quota</TableCell>
                <TableCell>
                  Maximum of 1,000 requests per day per API
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Typography mt={2} sx={{fontFamily: "Commissioner"}}>
          If you exceed 100 consecutive requests, your token will be
          temporarily restricted for 60 seconds before accepting new requests.
          The daily quota resets at 00:00 PST. Requests beyond the daily limit
          will result in a 429 Too Many Requests error.
        </Typography>
      </>
    ),
  },
  {
    label: "Error Codes",
    content: (
      <>
        <Typography mb={2} sx={{fontFamily: "Commissioner"}}>
          The API uses standard HTTP status codes to indicate request success or
          failure.
        </Typography>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Status Code</strong></TableCell>
                <TableCell><strong>Message</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>200</TableCell>
                <TableCell>OK</TableCell>
                <TableCell>Request was successful</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>400</TableCell>
                <TableCell>Bad Request</TableCell>
                <TableCell>
                  Invalid parameters or request format
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>401</TableCell>
                <TableCell>Unauthorized</TableCell>
                <TableCell>Missing or invalid API token</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>403</TableCell>
                <TableCell>Forbidden</TableCell>
                <TableCell>
                  Access denied to the requested resource
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>404</TableCell>
                <TableCell>Not Found</TableCell>
                <TableCell>
                  Requested resource or location not found
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>429</TableCell>
                <TableCell>Too Many Requests</TableCell>
                <TableCell>Rate limit exceeded</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>500</TableCell>
                <TableCell>Internal Server Error</TableCell>
                <TableCell>An unexpected server error occurred</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </>
    ),
  },
    {
    label: "API Structure",
    content: (
      <>
        <Typography mb={2} sx={{fontFamily: "Commissioner"}}>
          All successful responses from the TenDay Weather Forecast API follow a consistent JSON structure, typically composed of the following main parts:
        </Typography>

        <Typography
            sx={{
                fontFamily: "Commissioner",
                fontSize: "1.2rem",
                fontWeight: 600,
                background: "linear-gradient(90deg, #09bdec, #3f79ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
            }}
            >
                data (Forecast Results)
        </Typography>

        <Typography mb={2} sx={{fontFamily: "Commissioner"}}>
        This section contains the actual forecast information that was requested — such as rainfall, wind speed, temperature, etc., organized by location and date.
        </Typography>
        <SyntaxHighlighter language="json" style={vscDarkPlus}>
          {`"data": {
            "date": "7/7/25",
            "province": "Albay",
            "municity": "Tabaco City",
            "rainfall_desc": "LIGHT RAINS",
            "rainfall_total": 18.2,
            "cloud_cover": "CLOUDY",
            "tmean": 28.49,
            "tmin": 25.65,
            "tmax": 31.33,
            "humidity": 86,
            "wind_speed": 3.26,
            "wind_direction": "SSW",
        }`}
        </SyntaxHighlighter>
        <Typography mb={2} sx={{fontFamily: "Commissioner"}}>
            What it includes:<br /><br />
            • Location-based forecast (province and municipality)<br />
            • Weather variables: rainfall, wind speed, temperature<br />
            • Target forecast date (date)<br /><br />
            This section is the primary content users are requesting.
        </Typography>
        <br />
        <Typography
            sx={{
                fontFamily: "Commissioner",
                fontSize: "1.2rem",
                fontWeight: 600,
                background: "linear-gradient(90deg, #09bdec, #3f79ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
            }}
            >
            metadata (Forecast Dataset Information)
        </Typography>
        <Typography mb={2} sx={{fontFamily: "Commissioner"}}>
            The metadata field provides descriptive information about the forecast dataset itself, such as what kind of forecast it is, which location it covers, and its issuance reference. <br />
            This section is shared publicly and helps users verify which dataset they are viewing.
        </Typography>
        <SyntaxHighlighter language="json" style={vscDarkPlus}>
          {`"metadata": {
            "request_no": 12345,
            "api": "Forecast by Date",
            "forecast": "10-day Forecast",
            "issuance_date": "7/7/2025",
            "region": " Bicol Region (Region V)",
            "province": "Camarines Norte",
            "municity": "Daet"
            }`}
        </SyntaxHighlighter> <br />
        <TableContainer component={Paper} elevation={0}>
        <Table>
            <TableHead>
            <TableRow>
                <TableCell><strong>Field</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            <TableRow>
                <TableCell>request_no</TableCell>
                <TableCell>A unique reference ID for the request or dataset</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>api</TableCell>
                <TableCell>The name of the API module used (Current Forecast, etc.)</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>forecast</TableCell>
                <TableCell>The type of forecast (e.g., 10-day Forecast)</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>issuance_date</TableCell>
                <TableCell>The date when the forecast was officially released</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>region</TableCell>
                <TableCell>The full name of the region (with label)</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>province</TableCell>
                <TableCell>The province covered by the forecast</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>municity</TableCell>
                <TableCell>The municity covered by the forecast</TableCell>
            </TableRow>
            </TableBody>
        </Table>
        </TableContainer><br />
        <Typography mb={2} sx={{fontFamily: "Commissioner"}}>
            This section helps users understand the scope and source of the forecast data they’re viewing.
        </Typography>
        <br />
        <Typography
            sx={{
                fontFamily: "Commissioner",
                fontSize: "1.2rem",
                fontWeight: 600,
                background: "linear-gradient(90deg, #09bdec, #3f79ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
            }}
            >
            misc (Request Processing Info)
        </Typography>
        <Typography mb={2} sx={{fontFamily: "Commissioner"}}>
            The misc object provides technical details about how the API handled the request. It includes request method information, response status, versioning, and pagination metadata (when applicable).
            This object is primarily intended for developers and integrators to verify and debug API behavior.
        </Typography>
        <SyntaxHighlighter language="json" style={vscDarkPlus}>
          {` "misc": {
            "version": "1.0",
            "timestamp": "7/7/2025 10:36:47 AM",
            "method": "GET",
            "current_page": 1,
            "per_page": 10,
            "total_count": 12,
            "total_page": 2,
            "status_code": 200,
            "description": "OK",
            }`}
        </SyntaxHighlighter> <br />
        <TableContainer component={Paper} elevation={0}>
        <Table>
            <TableHead>
            <TableRow>
                <TableCell><strong>Field</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            <TableRow>
                <TableCell>version</TableCell>
                <TableCell>API version used to process the request</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>timestamp</TableCell>
                <TableCell>Date and time when the request was handled (server time)</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>method</TableCell>
                <TableCell>HTTP method used (e.g., GET, POST)</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>current_page</TableCell>
                <TableCell>Current page number in paginated results</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>per_page</TableCell>
                <TableCell>Maximum number of records returned per page</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>total_count</TableCell>
                <TableCell>Total number of matching records (string format for consistency)</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>total_page</TableCell>
                <TableCell>Total number of pages based on the current query and pagination settings</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>status_code</TableCell>
                <TableCell>HTTP response status code (200, 400, 404, etc.)</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>description</TableCell>
                <TableCell>Short message describing the result of the request</TableCell>
            </TableRow>
            </TableBody>
        </Table>
        </TableContainer>
        <br />
      </>
    ),
  },
    {
  label: "Glossary of Terms",
  content: (
    <>
      <Typography mb={2} sx={{ fontFamily: "Commissioner", fontSize: "1rem" }}>
        This section defines key terms and abbreviations used throughout the TenDay Weather Forecast API documentation.
      </Typography>

      <TableContainer component={Paper} elevation={0}>
        <Table sx={{ fontFamily: "Commissioner" }}>
          <TableHead>
            <TableRow>
              <TableCell><strong>Term</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>API</TableCell>
              <TableCell>
                <em>Application Programming Interface</em>. A set of rules and protocols that allow different software applications to communicate with each other. In this system, APIs let other tools or systems access climate data securely.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>API Token</TableCell>
              <TableCell>
                A unique string of characters used to authenticate and authorize a user or system to access the API. Tokens ensure secure communication.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Burst Limit</TableCell>
              <TableCell>
                The maximum number of consecutive requests allowed before triggering a cooldown.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>CERAM</TableCell>
              <TableCell>
                <em>Climate Exposure Risk and Adaptation Matrix</em>. A dataset or model used to analyze long-term climate projections and impacts.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cooldown Period</TableCell>
              <TableCell>
                A time window (e.g., 60 seconds) during which no requests are allowed after hitting the burst limit.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Forecast</TableCell>
              <TableCell>
                A prediction or estimate of future weather or climate conditions based on models and historical data.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>HTTP Status Code</TableCell>
              <TableCell>
                A code returned by the API indicating success (200), client error (400), or server error (500).
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>PSGC</TableCell>
              <TableCell>
                <em>Philippine Standard Geographic Code</em>. Standardized numerical codes assigned to regions, provinces, and municipalities.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Rate Limiting</TableCell>
              <TableCell>
                A method of controlling the number of requests a user can make within a certain time frame.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  ),
}

];

export default function Concept() {
  const [selectedTab, setSelectedTab] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <Box
      id="concept"
      ref={ref}
      sx={{
        py: 8,
        px: { xs: 2, md: 8 },
        transition: "all 0.5s ease",
      }}
    >
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{
          fontFamily: "Commissioner",
          textAlign: "left",
          color: "#617487",
        }}
      >
        Concepts
      </Typography>

      <Typography
        variant="subtitle1"
        sx={{
          fontFamily: "Commissioner",
          textAlign: "left",
          color: "#617487",
          mt: 1,
        }}
      >
        Understand the core ideas behind our API from data structure and coverage to modeling techniques and best practices.
      </Typography><br />

      <Tabs
        value={selectedTab}
        onChange={(e, newVal) => setSelectedTab(newVal)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          borderBottom: "2px solid #ccc",
          "& .MuiTab-root": { fontWeight: "bold" },
        }}
      >
        {concepts.map((concept, i) => (
          <Tab key={i} label={concept.label} />
        ))}
      </Tabs>

      {concepts.map((concept, i) => (
        <Fade key={i} in={selectedTab === i && inView} timeout={600}>
          <Box
            sx={{
              display: selectedTab === i ? "block" : "none",
              transform: inView ? "translateX(0)" : "translateX(50px)",
              transition: "transform 0.6s ease",
            }}
          >
            {concept.content}
          </Box>
        </Fade>
      ))}
    </Box>
  );
}
