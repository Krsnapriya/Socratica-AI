/**
 * rateLimiter.js
 * Redis-backed rate limiters using express-rate-limit + rate-limit-redis.
 *
 * Falls back to the default in-memory store if Redis is unavailable,
 * so the server starts even without Redis during local development.
 */

const rateLimit = require("express-rate-limit");

let RedisStore;
let redisClient;

// Only wire up Redis if ioredis + rate-limit-redis are available AND REDIS_URL is set
if (process.env.REDIS_URL) {
  try {
    const { default: RLS } = require("rate-limit-redis");
    const Redis = require("ioredis");
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    redisClient.on("error", (err) => {
      console.warn("[rateLimiter] Redis error (using memory fallback):", err.message);
    });
    RedisStore = (prefix) =>
      new RLS({
        sendCommand: (...args) => redisClient.call(...args),
        prefix,
      });
  } catch (e) {
    console.warn("[rateLimiter] rate-limit-redis not installed — using in-memory store:", e.message);
  }
}

const storeOrUndefined = (prefix) => (RedisStore ? RedisStore(prefix) : undefined);

// General API rate limit: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store: storeOrUndefined("rl:api:"),
});

// Compiler / LLM: 10 requests per minute per IP
const compilerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many compilation attempts. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
  store: storeOrUndefined("rl:compiler:"),
});

// Auth endpoints: 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store: storeOrUndefined("rl:auth:"),
});

module.exports = {
  apiLimiter,
  compilerLimiter,
  authLimiter,
};
