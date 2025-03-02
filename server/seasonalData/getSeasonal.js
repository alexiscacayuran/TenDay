import { pool } from "../db.js";
import { redisClient } from "../db.js";
import moment from "moment";

export const getSeasonal = async (provinceName, startMonth, startYear) => {
  try {
    const startDate = moment(`${startYear}-${startMonth}-01`, "YYYY-MM-DD");
    const endDate = startDate.clone().add(5, "months"); // Extend to 5 months
    const cacheKey = `seasonal:${provinceName}:${startYear}-${startMonth}`;

    // Check if data is cached
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);

    // SQL Query
    const query = `
      SELECT
        province.name AS "province",
        TO_CHAR(TO_DATE(sf_date.month, 'Mon'), 'FMMonth') || ' ' || sf_date.year AS "date",
        forecast_rf.min AS "min_mm",
        forecast_rf.max AS "max_mm",
        forecast_rf.mean AS "mean_mm",
        percent_n.mean AS "mean_percent",
        percent_n.description AS "description"
      FROM province
      INNER JOIN sf_date ON sf_date.province_id = province.id
      INNER JOIN forecast_rf ON forecast_rf.date_id = sf_date.id
      INNER JOIN percent_n ON percent_n.date_id = sf_date.id
      WHERE province.name = $1
        AND (sf_date.year > $2 
             OR (sf_date.year = $2 AND TO_NUMBER(TO_CHAR(TO_DATE(sf_date.month, 'Mon'), 'MM'), '99') >= $3))
        AND (sf_date.year < $4 
             OR (sf_date.year = $4 AND TO_NUMBER(TO_CHAR(TO_DATE(sf_date.month, 'Mon'), 'MM'), '99') <= $5))
      ORDER BY sf_date.year, TO_NUMBER(TO_CHAR(TO_DATE(sf_date.month, 'Mon'), 'MM'), '99')
    `;

    // ✅ Pass all 5 required parameters
    const result = await pool.query(query, [
      provinceName,
      startYear,
      startMonth,
      endDate.year(),
      endDate.month() + 1
    ]);

    const data = result.rows;

    // Cache the result
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));

    return data;
  } catch (error) {
    console.error("Error fetching seasonal data:", error);
    throw error;
  }
};
