import { Router } from "express"; 
import pool from "../db.js";  
import bcrypt from "bcrypt";  //hashing
import jwtGenerator from "../utils/jwtGenerator.js";  
import validInfo from "../middleware/validInfo.js"; 
import authorization from "../middleware/authorization.js";  

const router = Router();

// REGISTERING ROUTE
router.post("/register", validInfo, async (req, res) => {
  try {
    const { user_id, name, password } = req.body;

    const users = await pool.query("SELECT * FROM users WHERE user_id = $1", [user_id]);

    if (users.rows.length !== 0) {
      return res.status(401).send("User already exists");
    }

    // Bcrypt the provided password before storing it in the database
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);  // Generate salt for hashing
    const bcryptPassword = await bcrypt.hash(password, salt);  // Hash the provided password

    const newUser = await pool.query(
      "INSERT INTO users (user_id, name, password) VALUES($1, $2, $3) RETURNING *",
      [user_id, name, bcryptPassword]
    );

    // Generate a JWT token for the newly registered user
    const token = jwtGenerator(newUser.rows[0].user_id);

    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error A");
  }
});

// LOGIN ROUTE
router.post("/login", validInfo, async (req, res) => {
  try {
    const { user_id, password } = req.body;

    const users = await pool.query("SELECT * FROM users WHERE user_id = $1", [user_id]);

    if (users.rows.length === 0) {
      return res.status(401).json("User ID is incorrect");
    }

    const validPassword = await bcrypt.compare(password, users.rows[0].password);

    if (!validPassword) {
      return res.status(401).json("Password is incorrect");
    }

    const token = jwtGenerator(users.rows[0].user_id);

    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error B");
  }
});

// VERIFY ROUTE
router.get("/is-verify", authorization, async (req, res) => {
  try {
    res.json(true);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error C");
  }
});

export default router;
