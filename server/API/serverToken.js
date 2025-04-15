import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  const token = process.env.SERVER_TOKEN;

  if (!token) {
    return res.status(404).json({ error: "Token not found" });
  }

  res.json({ token });
});

export default router;
