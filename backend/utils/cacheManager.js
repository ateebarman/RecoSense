const { createClient } = require('redis');

let redisClient = null;
const isProduction = process.env.NODE_ENV === 'production';
const REDIS_URL = process.env.REDIS_URL;

// Simple in-memory fallback for local dev without Redis
const memoryStore = new Map();

const initRedis = async () => {
    if (!REDIS_URL) {
        console.log('Redis URL not found. Using memory-cache fallback.');
        return;
    }

    try {
        redisClient = createClient({ url: REDIS_URL });
        redisClient.on('error', (err) => console.log('Redis Client Error', err));
        await redisClient.connect();
        console.log('Connected to Redis successfully.');
    } catch (err) {
        console.error('Redis connection failed:', err);
        redisClient = null;
    }
};

const get = async (key) => {
    if (redisClient) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }
    return memoryStore.get(key) || null;
};

const set = async (key, value, ttlSeconds = 300) => {
    if (redisClient) {
        await redisClient.set(key, JSON.stringify(value), {
            EX: ttlSeconds
        });
    } else {
        memoryStore.set(key, value);
        // Basic TTL for memory store
        setTimeout(() => memoryStore.delete(key), ttlSeconds * 1000);
    }
};

const flush = async () => {
    if (redisClient) {
        await redisClient.flushAll();
    } else {
        memoryStore.clear();
    }
};

module.exports = { initRedis, get, set, flush };
