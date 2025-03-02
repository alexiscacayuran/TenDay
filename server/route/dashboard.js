import { Router } from "express"; 
import { pool } from "../db.js"; 
import authorization from "../middleware/authorization.js"; 

const router = Router(); 

router.post("/", authorization, async (req, res) => {
    try {
         const users = await pool.query("SELECT name FROM users WHERE user_id = $1;", [req.user]);
         const userCount = await pool.query("SELECT COUNT(*) AS muni FROM municities;");
         const filesCount = await pool.query("SELECT COUNT(*) AS filesCount FROM activity_log;");

         res.json({
             name: users.rows[0].user_name,
             municities: userCount.rows[0].muni,
             myFiles: filesCount.rows[0].filesCount
        });

    } catch (err) {
        console.error(err.message);
        return res.status(403).json("Server Error");
    }
});

export default router;
