const rateLimit = require("express-rate-limit");
const { config } = require("../configLoader");

let RedisStore;
let redisClient;

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

const apiLimiter = rateLimit({
  windowMs: config.rateLimits.api.windowMs,
  max: config.rateLimits.api.max,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store: storeOrUndefined("rl:api:"),
});

const compilerLimiter = rateLimit({
  windowMs: config.rateLimits.compiler.windowMs,
  max: config.rateLimits.compiler.max,
  message: { error: "Too many compilation attempts. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
  store: storeOrUndefined("rl:compiler:"),
});

const authLimiter = rateLimit({
  windowMs: config.rateLimits.auth.windowMs,
  max: config.rateLimits.auth.max,
  message: { error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store: storeOrUndefined("rl:auth:"),
});

module.exports = { apiLimiter, compilerLimiter, authLimiter };
