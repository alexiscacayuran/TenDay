import { Router } from "express";
import authorization from "../middleware/authorization.js";

const router = Router();

router.get("/", authorization, async (req, res) => {
  try {
    res.json({ message: "Secure Token Management", userId: req.user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
