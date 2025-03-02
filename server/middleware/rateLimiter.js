import { redisClient } from '../db.js';

export const rateLimiter = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const redisKey = `rateLimit:${token}:${today}`;

  try {
    const currentUsage = await redisClient.get(redisKey);

    if (currentUsage && parseInt(currentUsage) >= 100) {
      return res.status(429).json({ error: 'Daily request limit exceeded. Try again tomorrow.' });
    }

    // Increment request count with expiration (reset daily)
    await redisClient.incr(redisKey);
    await redisClient.expire(redisKey, 86400); // 24 hours

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
