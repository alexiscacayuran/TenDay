import { pool } from "../db.js";
import { redisClient } from "../db.js";
import moment from "moment";

export const getSeasonal = async (provinceName, startMonth, startYear) => {
  try {
    if (isNaN(startMonth) || startMonth < 1 || startMonth > 12) {
      throw new Error("Invalid startMonth. Must be between 1 and 12.");
    }

    const startDate = moment(`${startYear}-${startMonth}-01`, "YYYY-MM-DD").add(1, "month");
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const issuanceDate = `${monthOrder[startMonth - 1]} ${startYear}`;
    const cacheKey = `seasonal:${provinceName}:${startYear}-${monthOrder[startMonth - 1]}`;

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log("Cache hit for:", cacheKey);
        return {
          api: "Get Seasonal Forecast",
          forecast: "Seasonal Forecast",
          province: provinceName,
          issuance_date: issuanceDate,
          version: 1,
          data: JSON.parse(cachedData).map((row, index) => {
            const monthIndex = (startMonth + index) % 12;
            return {
              ...row,
              date: `Month ${index + 1} (${monthOrder[monthIndex]})`,
            };
          }),
          timestamp: new Date().toISOString(),
          status_code: 200,
          description: "Request successful. The server has responded as required.",
          method: "GET",
        };
      }
    } catch (redisError) {
      console.error("Redis error:", redisError);
    }

    const query = `
      SELECT
        p.name AS "province",
        sd.year AS "year",
        sd.month AS "month",
        fr.min AS "min_mm",
        fr.max AS "max_mm",
        fr.mean AS "mean_mm",
        pn.mean AS "percent_normal",
        pn.description AS "description"
      FROM province p
      JOIN sf_date sd ON sd.province_id = p.id
      JOIN forecast_rf fr ON fr.date_id = sd.id
      JOIN percent_n pn ON pn.date_id = sd.id
      WHERE p.name = $1
        AND sd.year >= $2
        AND sd.month IN (${monthOrder.map((_, i) => `$${i + 3}`).join(", ")})
      ORDER BY sd.year ASC, 
               CASE sd.month
                 WHEN 'Jan' THEN 1
                 WHEN 'Feb' THEN 2
                 WHEN 'Mar' THEN 3
                 WHEN 'Apr' THEN 4
                 WHEN 'May' THEN 5
                 WHEN 'Jun' THEN 6
                 WHEN 'Jul' THEN 7
                 WHEN 'Aug' THEN 8
                 WHEN 'Sep' THEN 9
                 WHEN 'Oct' THEN 10
                 WHEN 'Nov' THEN 11
                 WHEN 'Dec' THEN 12
               END ASC;
    `;

    const queryParams = [provinceName, startYear, ...monthOrder];
    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return {
        api: "Get Seasonal Forecast",
        forecast: "Seasonal Forecast",
        province: provinceName,
        issuance_date: issuanceDate,
        version: 1,
        data: [],
        error: "No data found",
        timestamp: new Date().toISOString(),
        method: "GET",
        status_code: 404,
        description: "No data available for the given parameters.",
      };
    }

    const data = result.rows.map((row, index) => {
      const monthIndex = (startMonth + index) % 12;
      return {
        date: `Month ${index + 1} (${monthOrder[monthIndex]})`,
        min_mm: row.min_mm,
        max_mm: row.max_mm,
        mean_mm: row.mean_mm,
        percent_normal: row.percent_normal,
        description: row.description,
      };
    });

    try {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
    } catch (redisError) {
      console.error("Failed to cache data in Redis:", redisError);
    }

    return {
      api: "Get Seasonal Forecast",
      forecast: "Seasonal Forecast",
      province: provinceName,
      issuance_date: issuanceDate,
      version: 1,
      data: data,
      timestamp: new Date().toISOString(),
      method: "GET",
      status_code: 200,
      description: "Request successful. The server has responded as required.",
    };
  } catch (error) {
    console.error("Error fetching seasonal data:", error);

    return {
      api: "Get Seasonal Forecast",
      forecast: "Seasonal Forecast",
      province: provinceName,
      issuance_date: "Error Occurred",
      version: 1,
      error: error.message || "Internal Server Error",
      data: [],
      timestamp: new Date().toISOString(),
      method: "GET",
      status_code: 500,
      description: "An error occurred while processing the request.",
    };
  }
};
