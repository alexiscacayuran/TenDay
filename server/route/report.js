import { Router } from "express";
import { pool } from "../db.js";
import authorization from "../middleware/authorization.js";

const router = Router();

router.post("/", authorization, async (req, res) => {
  try {
    const userRes = await pool.query("SELECT name FROM users WHERE user_id = $1;", [req.user]);
    const ownerRes = await pool.query("SELECT owner_type FROM users WHERE user_id = $1;", [req.user]);
    const userCount = await pool.query("SELECT COUNT(*) AS muni FROM municities;");
    const filesCount = await pool.query("SELECT COUNT(*) AS filescount FROM activity_log;");
    const apiCount = await pool.query("SELECT COUNT(*) AS apicount FROM api_logs WHERE organization <> '10-Day Forecast';");

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name } = userRes.rows[0];
    const { owner_type } = ownerRes.rows[0];
    const { muni } = userCount.rows[0];
    const { filescount } = filesCount.rows[0];
    const { apicount } = apiCount.rows[0];

    res.json({
      name,
      owner: owner_type,
      municities: parseInt(muni, 10),
      myFiles: parseInt(filescount, 10),
      api: parseInt(apicount, 10),
    });

    console.log("User:", name);
    console.log("Type:", owner_type);
    console.log("Municities Count:", muni);
    console.log("Files Count:", filescount);
    console.log("API Count:", apicount);

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

export default router;
