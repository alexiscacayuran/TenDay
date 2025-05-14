import pg from 'pg';
import { createClient } from 'redis';
import Redis from 'ioredis';

const { Pool } = pg;

// PostgreSQL configuration
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    //host: process.env.DB_HOST,
    host: process.env.AWS_PORT,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    max: 100,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Redis configuration
const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.on('connect', () => console.log('Connected to Redis!'));
redisClient.on('error', (err) => console.error('Redis connection error:', err));

await redisClient.connect();

const ioredis = new Redis({
    host: process.env.REDIS_HOST,
    port: 6379,
  });

  export { pool, redisClient, ioredis };
