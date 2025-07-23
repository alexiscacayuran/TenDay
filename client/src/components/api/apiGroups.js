const apiGroups = [
    {
      name: "10-Day Forecast",
      apis: [
        {
          title: "Current Forecast",
          description: "Provides current weather params for each municipality or province.",
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
            python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/current?municity=Sorsogon%20City&province=Sorsogon'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`
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
            curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/full?municity=Sorsogon%20City&province=Sorsogon' -H 'token: YOUR_TOKEN'",
            javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/tenday/full?municity=Sorsogon%20City&province=Sorsogon', {\n  headers: { token: 'YOUR_TOKEN' }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`,
            python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/full?municity=Sorsogon%20City&province=Sorsogon'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`
          },
          sampleResponse: {
            metadata: {
              request_no: 16905,
              api: "Full Forecast",
              forecast: "10-day Forecast",
              issuance_date: "7/18/2025",
              start_date: "7/18/2025",
              end_date: "7/27/2025",
              region: "Bicol Region (Region V)",
              province: "Sorsogon",
              municity: "City of Sorsogon"
            },
            data: [
              {
                date: "7/18/2025",
                rainfall_desc: "HEAVY RAINS",
                rainfall_total: 48.14,
                cloud_cover: "CLOUDY",
                tmean: 26.16,
                tmin: 24.58,
                tmax: 27.73,
                humidity: 86,
                wind_speed: 9.19,
                wind_direction: "SW"
              },
              {
                date: "7/27/2025",
                rainfall_desc: "MODERATE RAINS",
                rainfall_total: 7.65,
                cloud_cover: "CLOUDY",
                tmean: 27.36,
                tmin: 25.69,
                tmax: 29.03,
                humidity: 89,
                wind_speed: 7.05,
                wind_direction: "SW"
              }
            ],
            misc: {
              version: "1.0",
              timestamp: "7/22/2025 12:58:01 AM",
              method: "GET",
              current_page: 1,
              per_page: 10,
              total_count: 10,
              total_page: 1,
              status_code: 200,
              description: "OK"
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
              description: "Filters forecast results based on the selected date. (format: MM-DD-YYYY)\n* Refer to the Issuance API under 10-Day for available dates."
            },
            {
              name: "municity",
              requirement: "either required",
              description: "Filters the forecast by municipality or city.\n* For available values, refer to the Location API under Validation."
            },
            {
              name: "province",
              requirement: "either required",
              description: "Filters the forecast by province.\n* For the full list, check the Location API under Validation."
            },
            {
              name: "region",
              requirement: "either required",
              description: "Filters the forecast by region.\n* To view the complete list, refer to the Location API section under Validation."
            },
            {
              name: "page",
              requirement: "optional",
              description: "Allows access to additional pages of the API response. Use none to disable pagination."
            }
          ],
          tryItSamples: {
            curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/date?municity=Sorsog&date=07-24-2025' -H 'token: YOUR_TOKEN'",
            javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/tenday/date?municity=Sorsog&date=07-24-2025', {\n  headers: { token: 'YOUR_TOKEN' }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`,
            python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/tenday/date?municity=Sorsog&date=07-24-2025'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`
          },
          sampleResponse: {
            metadata: {
              request_no: 12061,
              api: "Forecast by Date",
              forecast: "10-day Forecast",
              issuance_date: "7/16/2025",
              date: "7/23/2025",
              region: "Bicol Region (Region V)",
              province: "Sorsogon",
              municity: "City of Sorsogon"
            },
            data: {
              rainfall_desc: "LIGHT RAINS",
              rainfall_total: 0.94,
              cloud_cover: "CLOUDY",
              tmean: 26.94,
              tmin: 24.79,
              tmax: 29.08,
              humidity: 78,
              wind_speed: 6.65,
              wind_direction: "WSW"
            },
            misc: {
              version: "1.0",
              timestamp: "7/23/2025 1:44:27 AM",
              method: "GET",
              current_page: 1,
              per_page: 10,
              total_count: 1,
              total_pages: 1,
              status_code: 200,
              description: "OK"
            }
          }
        },
        {
            title: "Issuance",
            description: "Retrieves the most recent forecast issuance date and time.",
            endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/tenday/issuance",
            
            params: [],
          
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
          }
          
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
              {
                name: "value",
                requirement: "required",
                description: `Specifies the type of data to retrieve:\n• pn – Percent Normal (climatological comparison)\n• mm – Forecasted Rainfall (in millimeters)\n• all – Retrieves both pn and mm`
              },
              {
                name: "municity",
                requirement: "either required",
                description: "Filters the forecast by municipality or city.\n* For available values, refer to the Location API under Validation."
              },
              {
                name: "province",
                requirement: "either required",
                description: "Filters the forecast by province.\n* For the full list, check the Location API under Validation."
              },
              {
                name: "region",
                requirement: "either required",
                description: "Filters the forecast by region.\n* To view the complete list, refer to the Location API section under Validation."
              },
              {
                name: "page",
                requirement: "optional",
                description: "Allows access to additional pages of the API response. Use none to disable pagination."
              }
            ],
            tryItSamples: {
              curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/province?value=pn&province=Laguna'",
              javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/province?value=pn&province=Laguna')\n  .then(res => res.json())\n  .then(data => console.log(data));`,
              python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/province?value=pn&province=Laguna'\nresponse = requests.get(url)\nprint(response.json())`
            },
            sampleResponse: {
              "province": "Laguna",
              "value": "pn",
              "forecast": [
                { "month": "Aug", "mean": 102.5, "description": "Above Normal" },
                { "month": "Sep", "mean": 89.7, "description": "Normal" },
                { "month": "Oct", "mean": 76.2, "description": "Below Normal" },
                { "month": "Nov", "mean": 68.3, "description": "Below Normal" },
                { "month": "Dec", "mean": 91.1, "description": "Normal" },
                { "month": "Jan", "mean": 110.0, "description": "Above Normal" }
              ]
            }
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
              curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/region?region=5&value=all' -H 'token: YOUR_TOKEN'",
              javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/region?region=5&value=all', {\n  headers: { token: 'YOUR_TOKEN' }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`,
              python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/region?region=5&value=all'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`
            },
            sampleResponse: {
              metadata: {
                api: "Regional Forecast",
                forecast: "Seasonal Forecast",
                issuance_month: "May 2025",
                start_month: "June 2025",
                end_month: "November 2025",
                region: "Bicol Region (Region V)"
              },
              data: [
                {
                  month: "June 2025",
                  province: "Albay",
                  region: "Bicol Region (Region V)",
                  mean_mm: 217.47647,
                  min_mm: 201.67645,
                  max_mm: 243.37228,
                  percent_normal: 110.95271,
                  description: "Near Normal"
                },
                {
                  month: "November 2025",
                  province: "Sorsogon",
                  region: "Bicol Region (Region V)",
                  mean_mm: 530.2558,
                  min_mm: 361.5794,
                  max_mm: 673.2907,
                  percent_normal: 123.15251,
                  description: "Above Normal"
                }
              ],
              misc: {
                version: "1.0",
                timestamp: "7/23/2025 9:31:19 AM",
                method: "GET",
                current_page: 1,
                per_page: 10,
                total_count: 6,
                total_pages: 1,
                status_code: 200,
                description: "OK"
              }
            }
          },
                  {
            title: "Issuance",
            description: "Retrieves the most recent forecast issuance date and time.",
            endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/issuance",
            
            params: [],
          
            tryItSamples: {
              curl: "curl -X GET 'https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/issuance'",
              javascript: `fetch('https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/issuance')\n  .then(res => res.json())\n  .then(data => console.log(data));`,
              python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/seasonal/issuance'\nresponse = requests.get(url)\nprint(response.json())`,
            },            
            
            sampleResponse: {
                "latest_batch": "184",
                "latest_date": "2025-05",
                "latest_time": "10:52:36 AM",
                "start_date": "2025-06",
                "end_date": "2025-11"
              }
          }          
        ]
      },
      {
        name: "Projections",
        apis: [
          {
            title: "CERAM",
            description: "Climate Exposure, Risk, and Adaptation Mapping — offers province-level climate risk data to support adaptation and vulnerability analysis.",
            endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/projections/ceram",
            params: [
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
              python: `import requests\nurl = 'https://tenday.pagasa.dost.gov.ph/api/v1/projections/ceram?province=Sorsogon&indicator_code=RX5day&observed_baseline=343.6&range=Median&scenario=585&start_period=2051'\nheaders = {'token': 'YOUR_TOKEN'}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`
            },
            sampleResponse: {
                "metadata": {
                    "api": "CERAM",
                    "forecast": "Climate Extremes Risk Analysis Matrix",
                    "province": "Sorsogon",
                    "region": "Bicol Region (Region V)"
                },
                "data": [
                    {
                        "indicator_code": "RX5day",
                        "observed_baseline": 343.6,
                        "range": "Median",
                        "scenario": "585",
                        "start_period": 2051,
                        "end_period": 2080,
                        "projected_value": 374.6,
                        "change": 9
                    }
                ],
                "misc": {
                    "version": "1.0",
                    "timestamp": "7/23/2025, 3:36:07 PM",
                    "method": "GET",
                    "current_page": 1,
                    "per_page": 10,
                    "total_count": 1,
                    "total_pages": 1,
                    "status_code": 200,
                    "description": "OK"
                }
            }
          }
        ]
      },
      {
        name: "File Retrieval",
        apis: [
          {
            title: "10-day File Retrieval API",
            description: "Retrieves gridded forecast files for a given issuance date from the 10-day forecast. Supports daily or all-target file download for various weather variables.",
            endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/file/tenday",
            params: [
              {
                name: "issuance_date",
                requirement: "required",
                description: "The date the forecast was issued. (format: YYYYMMDD)\n* For the latest issuance date, check the Issuance API under 10-day."
              },
              {
                name: "file",
                requirement: "required",
                description: `Specifies the forecast file to retrieve:\n• TMEAN – Mean Temperature\n• TMIN – Minimum Temperature\n• TMAX – Maximum Temperature\n• RH – Relative Humidity\n• TCC – Total Cloud Cover\n• TP – Total Precipitation\n• WD – Wind Direction\n• WS – Wind Speed`
              },
              {
                name: "token",
                requirement: "required",
                description: "API token for authentication."
              },
              {
                name: "target",
                requirement: "optional",
                description: "Specifies the forecast file date to download (format: YYYYMMDD).\n* Use the start/end dates from the 10-day Issuance API."
              },
              {
                name: "masked",
                requirement: "optional",
                description: `If "true" or "1", returns the masked (clipped) version of the file. Default is "false" or "0".`
              }
            ]
          },
          {
            title: "Seasonal File Retrieval API",
            description: "Download seasonal forecast files (Percent Normal and/or Forecast Rainfall) using the batch reference from the seasonal issuance.",
            endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/file/seasonal",
            params: [
              {
                name: "batch",
                requirement: "required",
                description: "The batch number representing the forecast period.\n* Check the Seasonal Issuance API for the latest batch."
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
            ]
          },
          {
            title: "CERAM File Retrieval API",
            description: "Download datasets for the Climate Extremes Risk Analysis Matrix (CERAM), based on specific indicators, scenarios, and percentiles.",
            endpoint: "https://tenday.pagasa.dost.gov.ph/api/v1/file/ceram",
            params: [
              {
                name: "token",
                requirement: "required",
                description: "API token for authentication."
              },
              {
                name: "climate_indicator",
                requirement: "required",
                description: `Main climate variable:\n• RR – Rainfall\n• TMAX – Max Temperature\n• TMIN – Min Temperature`
              },
              {
                name: "indicator_code",
                requirement: "optional",
                description: `Specific indicator:\n• RR: rx1day, rx5day\n• TMAX: txm, txn, txx\n• TMIN: tnm, tnn, tnx`
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
            ]
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
  
  export default apiGroups;
  