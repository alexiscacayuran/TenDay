import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.jwtSecret;

export const authenticateToken = (req, res, next) => {
  const token = req.headers["token"]; // ✅ Get token from headers

  console.log("🔍 Received Token:", token); // Log received token

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log("❌ Invalid Token:", err.message);
      return res.status(401).json({ error: "Unauthorized! Invalid token." });
    }

    console.log("✅ Decoded Token:", decoded); // Log decoded token

    req.user = decoded; // Attach decoded data to request
    next();
  });
};
