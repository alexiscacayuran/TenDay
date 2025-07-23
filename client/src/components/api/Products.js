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
          javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/tenday/issuance')\n  .then(res => res.json())\n  .then(data => console.log(data));`,
          python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/issuance'\nresponse = requests.get(url)\nprint(response.json())`,
        },            
        
        sampleResponse: {
              "latest_date": "2025-07-21",
              "latest_time": "09:46:58 PM",
              "start_date": "2025-07-21",
              "end_date": "2025-07-30"
        }        
      },
    ]
  },
  {
    name: "Seasonal Forecast",
    apis: [
      {
        title: "Provincial Forecast",
        description: "Provides a seasonal forecast for the next six months for each province.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/province",
        params: [
          [
            {
              name: "value",
              requirement: "required",
              description: `Specifies the type of data to retrieve:\n• pn – Percent Normal (climatological comparison)\n• mm – Forecasted Rainfall (in millimeters)\n• all – Retrieves both pn and mm`
            },
            {
              name: "province",
              requirement: "either required",
              description: "Name of the province for which to retrieve the forecast.\n* For the full list, check the Location API under Validation."
            },
            {
              name: "page",
              requirement: "optional",
              description: "Allows access to additional pages of the API response. Use none to disable pagination."
            }
          ]          
        ],
        
        tryItSamples: {
          curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/province?province=Sorsogon&page=none&value=all' -H 'token: YOUR_TOKEN'",
          javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/province?province=Sorsogon&page=none&value=all', {\n  headers: { token: 'YOUR_TOKEN' }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`,
          python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/province?province=Sorsogon&page=none&value=all'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
        },    
        
        sampleResponse: {
          "metadata": {
              "api": "Province",
              "forecast": "Seasonal Forecast",
              "issuance_month": "May 2025",
              "start_month": "June 2025",
              "end_month": "November 2025",
              "province": "Sorsogon",
              "region": "Bicol Region (Region V)"
          },
          "data": [
              {
                  "month": "June 2025",
                  "min_mm": 212.20132,
                  "max_mm": 240.33804,
                  "mean_mm": 224.83203,
                  "percent_normal": 115.90077,
                  "description": "Near Normal"
              },
              {
                  "month": "November 2025",
                  "min_mm": 361.5794,
                  "max_mm": 673.2907,
                  "mean_mm": 530.2558,
                  "percent_normal": 123.15251,
                  "description": "Above Normal"
              }
          ],
          "misc": {
              "version": "1.0",
              "timestamp": "7/23/2025 9:23:51 AM",
              "method": "GET",
              "current_page": 1,
              "per_page": 10,
              "total_count": 1,
              "total_pages": 1,
              "status_code": 200,
              "description": "OK"
          }
      },        
      },
      {
        title: "Regional Forecast",
        description: "Provides a seasonal forecast for the next six months per province, grouped by region.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/region",
        params: [
          {
            name: "value",
            requirement: "required",
            description: `Specifies the type of data to retrieve:\n• pn – Percent Normal (climatological comparison)\n• mm – Forecasted Rainfall (in millimeters)\n• all – Retrieves both pn and mm`
          },
          {
            name: "region",
            requirement: "either required",
            description: `Use region code to filter by region.\n• Numerical: 1, 2, 3\n• Roman numerals: i, ii, iii\n• Alphanumeric: 4a, 4b\n• Alphabetical: ncr, car\n• PSGC: 0500000000\n* For available values, refer to the Location API under Validation.`
          },
          {
            name: "page",
            requirement: "optional",
            description: "Allows access to additional pages of the API response. Use none to disable pagination."
          }
        ],
        
        tryItSamples: {
          curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/region?region=5&&value=all' -H 'token: YOUR_TOKEN'",
          javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/region?region=5&value=all', {\n  headers: { token: 'YOUR_TOKEN' }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`,
          python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/region?region=5&value=all'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
        },            
        
        sampleResponse: {
          "metadata": {
              "api": "Regional Forecast",
              "forecast": "Seasonal Forecast",
              "issuance_month": "May 2025",
              "start_month": "June 2025",
              "end_month": "November 2025",
              "region": "Bicol Region (Region V)"
          },
          "data": [
              {
                  "month": "June 2025",
                  "province": "Albay",
                  "region": "Bicol Region (Region V)",
                  "mean_mm": 217.47647,
                  "min_mm": 201.67645,
                  "max_mm": 243.37228,
                  "percent_normal": 110.95271,
                  "description": "Near Normal"
              },
              //...
              {
                  "month": "November 2025",
                  "province": "Sorsogon",
                  "region": "Bicol Region (Region V)",
                  "mean_mm": 530.2558,
                  "min_mm": 361.5794,
                  "max_mm": 673.2907,
                  "percent_normal": 123.15251,
                  "description": "Above Normal"
              }
          ],
          "misc": {
              "version": "1.0",
              "timestamp": "7/23/2025 9:31:19 AM",
              "method": "GET",
              "current_page": 1,
              "per_page": 10,
              "total_count": 6,
              "total_pages": 1,
              "status_code": 200,
              "description": "OK"
          }
      },  
      },
    ]
  },
  {
    name: "Projections",
    apis: [
      {
        title: "CERAM",
        description: "Climate Exposure, Risk, and Adaptation Mapping — offers province-level climate risk data to support adaptation and vulnerability analysis.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/projections/ceram",
        parameters: [
          {
            name: "province",
            requirement: "optional",
            description: "Filter by province name"
          },
          {
            name: "indicator_code",
            requirement: "optional",
            description: "Climate indicator code (e.g., temperature or rainfall metric)"
          },
          {
            name: "range",
            requirement: "optional",
            description: "Projection range or quantile"
          },
          {
            name: "observed_baseline",
            requirement: "optional",
            description: "Observed baseline value used for comparison"
          },
          {
            name: "scenario",
            requirement: "optional",
            description: "Emissions scenario (based on SSPs)"
          },
          {
            name: "start_period",
            requirement: "optional",
            description: "Starting year of projection"
          },
          {
            name: "end_period",
            requirement: "optional",
            description: "Ending year of projection"
          },
          {
            name: "page",
            requirement: "optional",
            description: "Allows access to additional pages of the API response. Use none to disable pagination."
          }
        ],        
        
        tryItSamples: {
          curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/projections/ceram?province=Sorsogon&indicator_code=RX5day&observed_baseline=343.6&range=Median&scenario=585&start_period=2051' -H 'token: YOUR_TOKEN'",
          javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/projections/ceram?province=Sorsogon&indicator_code=RX5day&observed_baseline=343.6&range=Median&scenario=585&start_period=2051', {\n  headers: { token: 'YOUR_TOKEN' }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`,
          python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/projections/ceram?province=Sorsogon&indicator_code=RX5day&observed_baseline=343.6&range=Median&scenario=585&start_period=2051'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
        },                   
        
        sampleResponse: {
          "metadata": {
              "api": "Regional Forecast",
              "forecast": "Seasonal Forecast",
              "issuance_month": "May 2025",
              "start_month": "June 2025",
              "end_month": "November 2025",
              "region": "Bicol Region (Region V)"
          },
          "data": [
              {
                  "month": "June 2025",
                  "province": "Albay",
                  "region": "Bicol Region (Region V)",
                  "mean_mm": 217.47647,
                  "min_mm": 201.67645,
                  "max_mm": 243.37228,
                  "percent_normal": 110.95271,
                  "description": "Near Normal"
              },
              //...
              {
                  "month": "November 2025",
                  "province": "Sorsogon",
                  "region": "Bicol Region (Region V)",
                  "mean_mm": 530.2558,
                  "min_mm": 361.5794,
                  "max_mm": 673.2907,
                  "percent_normal": 123.15251,
                  "description": "Above Normal"
              }
          ],
          "misc": {
              "version": "1.0",
              "timestamp": "7/23/2025 9:31:19 AM",
              "method": "GET",
              "current_page": 1,
              "per_page": 10,
              "total_count": 6,
              "total_pages": 1,
              "status_code": 200,
              "description": "OK"
          }
      },  
      }
    ]
  },
  {
    name: "File Retrieval",
    apis: [
      {
        title: "10-day File Retrieval API",
        description: "Climate Exposure, Risk, and Adaptation Mapping — offers province-level climate risk data to support adaptation and vulnerability analysis.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/file/tenday",
        parameters: [
          {
            name: "issuance_date",
            requirement: "required",
            description: "The date the forecast was issued. (format: YYYYMMDD)\n* For the latest issuance date, check the Issuance API under 10-day."
          },
          {
            name: "file",
            requirement: "required",
            description: `Specifies the forecast file to retrieve.\n• TMEAN – Mean Temperature\n• TMIN – Minimum Temperature\n• TMAX – Maximum Temperature\n• RH – Relative Humidity\n• TCC – Total Cloud Cover\n• TP – Total Precipitation\n• WD – Wind Direction\n• WS – Wind Speed`
          },
          {
            name: "token",
            requirement: "required",
            description: "API token for authentication."
          },
          {
            name: "target",
            requirement: "optional",
            description: "Specifies the forecast file date you want to download (format: YYYYMMDD)\n* To determine the target dates, use the start and end dates from the 10-day Issuance API as your reference range."
          },
          {
            name: "masked",
            requirement: "optional",
            description: 'If "true" or "1", returns the masked version of the file (e.g., clipped to country boundaries). Default is "false" or "0".'
          }
        ],            
      },
      {
        title: "Seasonal File Retrieval API",
        description: "Lets you download weather forecast files for up to 10 days. You can get a single day’s file or all 10 days at once, making it easy to access and use the data.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/file/seasonal",
        parameters: [
          {
            name: "batch",
            requirement: "required",
            description: "The batch number representing the forecast period.\n* For the latest batch, check the Issuance API under Seasonal."
          },
          {
            name: "value",
            requirement: "required",
            description: `Specifies which forecast file to retrieve:\n• PN – Percent Normal\n• MM – Forecast Rainfall\n• ALL – Both`
          },
          {
            name: "token",
            requirement: "required",
            description: "API token for authentication."
          }
        ],                             
      },
      {
        title: "CERAM File Retrieval API",
        description: "Lets you download datasets used for the Climate Extremes Risk Analysis Matrix (CERAM). These files support analysis of extreme climate indicators under various future climate scenarios.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/file/ceram",
        parameters: [
          {
            name: "token",
            requirement: "required",
            description: "API token for authentication."
          },
          {
            name: "climate_indicator",
            requirement: "required",
            description: `Main climate variable to filter data.\n• RR – Rainfall\n• TMAX – Max Temperature\n• TMIN – Min Temperature`
          },
          {
            name: "indicator_code",
            requirement: "optional",
            description: `Specific indicator under the selected climate variable:\n• RR: rx1day, rx5day\n• TMAX: txm, txn, txx\n• TMIN: tnm, tnn, tnx`
          },
          {
            name: "percentile",
            requirement: "optional",
            description: "Statistical level of the dataset.\n• 10, 25, 50, 75, 90, mean"
          },
          {
            name: "ssp",
            requirement: "optional",
            description: "Shared Socioeconomic Pathway scenario.\n• 119, 126, 245, 370, 585"
          }
        ],                         
      }
    ]
  },
  {
    name: "Validation",
    apis: [
      {
        title: "Validate",
        description: "Checks if the provided API token is valid, shows which APIs the token is authorized to access, and returns the token’s expiration date. Useful for verifying access rights and session status before making data requests.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/validate",
        params: [
          {
            name: "token",
            requirement: "required",
            description: "API token for authentication."
          }
        ],
        
        tryItSamples: {
          curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/validate?token=YOUR_API'",
          javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/validate?token=YOUR_API')\n  .then(res => res.json())\n  .then(data => console.log(data));`,
          python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/validate?token=YOUR_API'\nresponse = requests.get(url)\nprint(response.json())`
        },             
        
        sampleResponse: {
          "message": "Token is already activated",
          "expiration": "Lifetime Access",
          "authorized_apis": [
              "Full",
              "Date",
              "Region",
              "CERAM",
              "Province",
              "Location",
              "Files (10-day)"
          ]
      },  
      },
      {
        title: "Location",
        description: "Provides a list of regions, provinces, and municipalities with corresponding PSGC codes. Supports location-based filtering for forecast and projection data.",
        endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/location",
        params: [
          {
            name: "region",
            requirement: "optional",
            description: "Filter results by region"
          },
          {
            name: "province",
            requirement: "optional",
            description: "Filter results by province"
          }
        ],
        
        tryItSamples: {
          curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/location?province=Sorsogon'",
        
          javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/location?province=Sorsogon')\n  .then(res => res.json())\n  .then(data => console.log(data));`,
        
          python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/location?province=Sorsogon'\nresponse = requests.get(url)\nprint(response.json())`
        },                   
        
        sampleResponse: {
          "metadata": {
              "request_no": 17901,
              "api": "Location",
              "forecast": "Municipalities, Provinces, and Regions",
              "province": "Sorsogon",
              "region": "Bicol Region (Region V)"
          },
          "data": [
              {
                  "name": "Barcelona",
                  "psgc_code": "0506202000"
              },
              {
                  "name": "Bulan",
                  "psgc_code": "0506203000"
              },
              {
                  "name": "Bulusan",
                  "psgc_code": "0506204000"
              },
              {
                  "name": "Casiguran",
                  "psgc_code": "0506205000"
              },
              {
                  "name": "Castilla",
                  "psgc_code": "0506206000"
              },
              {
                  "name": "City of Sorsogon",
                  "psgc_code": "0506216000"
              },
              {
                  "name": "Donsol",
                  "psgc_code": "0506207000"
              },
              {
                  "name": "Gubat",
                  "psgc_code": "0506208000"
              },
              {
                  "name": "Irosin",
                  "psgc_code": "0506209000"
              },
              {
                  "name": "Juban",
                  "psgc_code": "0506210000"
              },
              {
                  "name": "Magallanes",
                  "psgc_code": "0506211000"
              },
              {
                  "name": "Matnog",
                  "psgc_code": "0506212000"
              },
              {
                  "name": "Pilar",
                  "psgc_code": "0506213000"
              },
              {
                  "name": "Prieto Diaz",
                  "psgc_code": "0506214000"
              },
              {
                  "name": "Santa Magdalena",
                  "psgc_code": "0506215000"
              }
          ],
          "footer": {
              "version": "1.0",
              "timestamp": "7/23/2025 9:33:01 PM",
              "method": "GET",
              "current_page": 1,
              "per_page": 15,
              "total_count": 15,
              "total_pages": 1,
              "status_code": 200,
              "description": "OK"
          }
      },
      },
    ]
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
