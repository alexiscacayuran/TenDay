import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Tab,
  Tabs,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// Structure: each main category is a tab; each has one or more endpoints (accordions)
const apiGroups = [
  {
    name: "10-Day Forecast",
    apis: [
      {
        title: "Current Forecast",
        description: "Provides current weather parameters for each municipality or province.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/tenday/current",
        params: [
          {
            name: "municity",
            requirement: "either required",
            description: "Filters the forecast by municipality or city. For available values, refer to the Location API under Validation."
          },
          {
            name: "province",
            requirement: "either required",
            description: "Filters the forecast by province. For the full list, check the Location API under Validation."
          },
          {
            name: "region",
            requirement: "either required",
            description: "Filters the forecast by region. To view the complete list, refer to the Location API section under Validation."
          },
          {
            name: "page",
            requirement: "optional",
            description: "Allows access to additional pages of the API response. Use none to disable pagination."
          }
        ],
        
        tryItSamples: {
          curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/current?municity=Sorsogon%20City&province=Sorsogon' -H 'token: YOUR_TOKEN'",
          javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/tenday/current?municity=Sorsogon%20City&province=Sorsogon', {\n  headers: { token: 'YOUR_TOKEN' }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`,
          python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/current?municity=Sorsogon%20City&province=Sorsogon'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
        },        
        
        sampleResponse: {
          metadata: {
            request_no: 16893,
            api: "Current Forecast",
            forecast: "10-day Forecast",
            issuance_date: "7/18/2025",
            region: "Bicol Region (Region V)",
            province: "Sorsogon",
            municity: "City of Sorsogon"
          },
          data: {
            date: "7/22/2025",
            rainfall_desc: "MODERATE RAINS",
            rainfall_total: "19.83",
            cloud_cover: "CLOUDY",
            tmean: "26.69",
            tmin: "25.47",
            tmax: "27.91",
            humidity: "84",
            wind_speed: "9.86",
            wind_direction: "SW"
          },
          misc: {
            version: "1.0",
            timestamp: "7/22/2025 12:48:48 AM",
            method: "GET",
            current_page: 1,
            per_page: 10,
            total_count: "1",
            total_page: 1,
            status_code: 200,
            description: "OK"
          }
        }        
      },
      {
        title: "Full Forecast",
        description: "Returns full 10-day weather data for each municipality or province.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/tenday/full",
        params: [
          {
            name: "municity",
            requirement: "either required",
            description:
              "Filters the forecast by municipality or city. For available values, refer to the Location API under Validation.",
          },
          {
            name: "province",
            requirement: "either required",
            description:
              "Filters the forecast by province. For the full list, check the Location API under Validation.",
          },
          {
            name: "region",
            requirement: "either required",
            description:
              "Filters the forecast by region. To view the complete list, refer to the Location API section under Validation.",
          },
          {
            name: "page",
            requirement: "optional",
            description:
              "Allows access to additional pages of the API response. Use none to disable pagination.",
          },
        ],        
        tryItSamples: {
          curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/full?municity=Sorsogon%20City&province=Sorsogon' -H 'token: YOUR_TOKEN'",
          javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/tenday/full?municity=Sorsogon%20City&province=Sorsogon', {\n  headers: { token: 'YOUR_TOKEN' }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`,
          python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/full?municity=Sorsogon%20City&province=Sorsogon'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
        },        
        sampleResponse: {
            "metadata": {
                "request_no": 16905,
                "api": "Full Forecast",
                "forecast": "10-day Forecast",
                "issuance_date": "7/18/2025",
                "start_date": "7/18/2025",
                "end_date": "7/27/2025",
                "region": "Bicol Region (Region V)",
                "province": "Sorsogon",
                "municity": "City of Sorsogon"
            },
            "data": [
                {
                    "date": "7/18/2025",
                    "rainfall_desc": "HEAVY RAINS",
                    "rainfall_total": 48.14,
                    "cloud_cover": "CLOUDY",
                    "tmean": 26.16,
                    "tmin": 24.58,
                    "tmax": 27.73,
                    "humidity": 86,
                    "wind_speed": 9.19,
                    "wind_direction": "SW"
                },
                //more entries
                {
                    "date": "7/27/2025",
                    "rainfall_desc": "MODERATE RAINS",
                    "rainfall_total": 7.65,
                    "cloud_cover": "CLOUDY",
                    "tmean": 27.36,
                    "tmin": 25.69,
                    "tmax": 29.03,
                    "humidity": 89,
                    "wind_speed": 7.05,
                    "wind_direction": "SW"
                }
            ],
            "misc": {
                "version": "1.0",
                "timestamp": "7/22/2025 12:58:01 AM",
                "method": "GET",
                "current_page": 1,
                "per_page": 10,
                "total_count": 10,
                "total_page": 1,
                "status_code": 200,
                "description": "OK"
        }
        }   
      },
      {
        title: "Date Forecast",
        description: "Fetches weather data by municipality or province for a specific date.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/tenday/date",
        params: [
          {
            name: "date",
            requirement: "Required",
            description:
              "Filters forecast results based on the selected date. (format: MM-DD-YYYY)\n* Refer to the Issuance API under 10-Day for available dates.",
          },
          {
            name: "municity",
            requirement: "either required",
            description:
              "Filters the forecast by municipality or city.\n* For available values, refer to the Location API under Validation.",
          },
          {
            name: "province",
            requirement: "either required",
            description:
              "Filters the forecast by province.\n* For the full list, check the Location API under Validation.",
          },
          {
            name: "region",
            requirement: "either required",
            description:
              "Filters the forecast by region.\n* To view the complete list, refer to the Location API section under Validation.",
          },
          {
            name: "page",
            requirement: "Optional",
            description:
              "Allows access to additional pages of the API response. Use none to disable pagination.",
          },
        ],             
        tryItSamples: {
          curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/date?municity=Sorsog&date=07-24-2025' -H 'token: YOUR_TOKEN'",
          javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/tenday/date?municity=Sorsog&date=07-24-2025', {
          headers: { token: 'YOUR_TOKEN' }
        })
          .then(res => res.json())
          .then(data => console.log(data));`,
          python: `import requests
        url = 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/date?municity=Sorsog&date=07-24-2025'
        headers = {'token': 'YOUR_TOKEN'}
        response = requests.get(url, headers=headers)
        print(response.json())`,
        },             
        sampleResponse: {
          "metadata": {
              "request_no": 12061,
              "api": "Forecast by Date",
              "forecast": "10-day Forecast",
              "issuance_date": "7/16/2025",
              "date": "7/23/2025",
              "region": "Bicol Region (Region V)",
              "province": "Sorsogon",
              "municity": "City of Sorsogon"
          },
          "data": {
              "rainfall_desc": "LIGHT RAINS",
              "rainfall_total": 0.94,
              "cloud_cover": "CLOUDY",
              "tmean": 26.94,
              "tmin": 24.79,
              "tmax": 29.08,
              "humidity": 78,
              "wind_speed": 6.65,
              "wind_direction": "WSW"
          },
          "misc": {
              "version": "1.0",
              "timestamp": "7/23/2025 1:44:27 AM",
              "method": "GET",
              "current_page": 1,
              "per_page": 10,
              "total_count": 1,
              "total_pages": 1,
              "status_code": 200,
              "description": "OK"
          }
      }
      },
      {
        title: "Issuance",
        description: "Retrieves the most recent forecast issuance date and time.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/tenday/issuance",
        
        tryItSamples: {
          curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/issuance'",
          javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/tenday/issuance', {\n  headers: { token: 'YOUR_TOKEN' }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`,
          python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/current?municity=Sorsogon%20City&province=Sorsogon'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
        },        
        
        sampleResponse: {
          metadata: {
            request_no: 16893,
            api: "Current Forecast",
            forecast: "10-day Forecast",
            issuance_date: "7/18/2025",
            region: "Bicol Region (Region V)",
            province: "Sorsogon",
            municity: "City of Sorsogon"
          },
          data: {
            date: "7/22/2025",
            rainfall_desc: "MODERATE RAINS",
            rainfall_total: "19.83",
            cloud_cover: "CLOUDY",
            tmean: "26.69",
            tmin: "25.47",
            tmax: "27.91",
            humidity: "84",
            wind_speed: "9.86",
            wind_direction: "SW"
          },
          misc: {
            version: "1.0",
            timestamp: "7/22/2025 12:48:48 AM",
            method: "GET",
            current_page: 1,
            per_page: 10,
            total_count: "1",
            total_page: 1,
            status_code: 200,
            description: "OK"
          }
        }        
      },
    ]
  },
  {
    name: "Seasonal Forecast",
    apis: []
  },
  {
    name: "Projections",
    apis: []
  },
  {
    name: "File Retrieval",
    apis: []
  },
  {
    name: "Validation",
    apis: []
  }
];

export default function Products() {
  const [tabIndex, setTabIndex] = useState(0);
  const [accordionOpen, setAccordionOpen] = useState(null);
  const [codeTab, setCodeTab] = useState(0);
  const [snackbar, setSnackbar] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleCopy = () => setSnackbar(true);

  return (
    <Box sx={{ px: isMobile ? 2 : 10, py: 6 }}>
      <Typography variant="h3" fontWeight="bold" mb={4}>API Documentation</Typography>

      <Tabs value={tabIndex} onChange={(e, val) => {
        setTabIndex(val);
        setAccordionOpen(null);
      }} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
        {apiGroups.map((group, i) => (
          <Tab key={i} label={group.name} />
        ))}
      </Tabs>

      {apiGroups[tabIndex].apis.map((api, index) => (
        <Accordion
          key={index}
          expanded={accordionOpen === index}
          onChange={() => setAccordionOpen(accordionOpen === index ? null : index)}
          sx={{
            mb: 2,
            borderRadius: 2,
            boxShadow: 3,
            "& .MuiAccordionSummary-root": {
              background: "linear-gradient(135deg, #3E7BFF, #5C33E1)",
              color: "white",
              borderRadius: 2
            }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}>
            <Typography fontWeight="bold">{api.title}</Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Typography variant="body1" mb={2}>{api.description}</Typography>

            <Box mb={2}>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography fontWeight="bold">Endpoint</Typography>
                <CopyToClipboard text={api.endpoint} onCopy={handleCopy}>
                  <Tooltip title="Copy to clipboard">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CopyToClipboard>
              </Box>
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                customStyle={{
                  borderRadius: 8,
                  fontSize: 14,
                  padding: 16,
                  backgroundColor: "#1e1e1e",
                  color: "#d4d4d4",
                  margin: 0
                }}
              >
                {`"${api.endpoint}"`}
              </SyntaxHighlighter>
            </Box>

            <Paper sx={{ overflow: "auto", mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><b>Parameter</b></TableCell>
                    <TableCell><b>Requirement</b></TableCell>
                    <TableCell><b>Description</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {api.params.map((param, i) => (
                    <TableRow key={i}>
                      <TableCell>{param.name}</TableCell>
                      <TableCell>{param.requirement}</TableCell>
                      <TableCell>{param.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <Tabs value={codeTab} onChange={(e, val) => setCodeTab(val)}>
                <Tab label="cURL" />
                <Tab label="JavaScript" />
                <Tab label="Python" />
              </Tabs>
            </Box>

            <Box mb={3}>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography fontWeight="bold">Code Sample</Typography>
                <CopyToClipboard
                  text={api.tryItSamples[["curl", "javascript", "python"][codeTab]]}
                  onCopy={handleCopy}
                >
                  <Tooltip title="Copy code">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CopyToClipboard>
              </Box>
              <SyntaxHighlighter
                language={["bash", "javascript", "python"][codeTab]}
                style={vscDarkPlus}
                customStyle={{ borderRadius: 8, fontSize: 14, padding: 16 }}
              >
                {api.tryItSamples[["curl", "javascript", "python"][codeTab]]}
              </SyntaxHighlighter>
            </Box>

            <Box>
              <Typography fontWeight="bold" mb={1}>Sample Response</Typography>
              <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{ borderRadius: 8, fontSize: 14 }}>
                {JSON.stringify(api.sampleResponse, null, 2)}
              </SyntaxHighlighter>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      <Snackbar
        open={snackbar}
        autoHideDuration={2000}
        onClose={() => setSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar(false)} severity="success" sx={{ width: "100%" }}>
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
}
