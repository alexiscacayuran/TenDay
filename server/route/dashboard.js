import { Router } from "express"; 
import { pool } from "../db.js"; 
import authorization from "../middleware/authorization.js"; 

const router = Router(); 

router.post("/", authorization, async (req, res) => {
    try {
         const users = await pool.query("SELECT name FROM users WHERE user_id = $1;", [req.user]);
         const userCount = await pool.query("SELECT COUNT(*) AS muni FROM municities;");
         const filesCount = await pool.query("SELECT COUNT(*) AS filesCount FROM activity_log;");
         const apiCount = await pool.query("SELECT COUNT(*) AS apiCount FROM api_logs WHERE organization <> '10-Day Forecast';");

         if (users.rows.length === 0) {
             return res.status(404).json({ error: "User not found" });
         }

         res.json({
            name: users.rows[0].name,
            municities: parseInt(userCount.rows[0].muni, 10),
            myFiles: parseInt(filesCount.rows[0].filescount, 10),
            api: parseInt(apiCount.rows[0].apicount, 10),
        });
        

        console.log("User:", users.rows);
console.log("Municities Count:", userCount.rows);
console.log("Files Count:", filesCount.rows);
console.log("API Count:", apiCount.rows);
        

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Server Error" });
    }
});


export default router;
