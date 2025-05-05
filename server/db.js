import pg from 'pg';
import { createClient } from 'redis';

const { Pool } = pg;

// PostgreSQL configuration
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    port: process.env.DB_PORT,
    database: process.env.DB_NAMENEW,
});

// Redis configuration
const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.on('connect', () => console.log('Connected to Redis!'));
redisClient.on('error', (err) => console.error('Redis connection error:', err));

await redisClient.connect();

export { pool, redisClient };