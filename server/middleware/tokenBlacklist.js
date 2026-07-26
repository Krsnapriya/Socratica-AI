/**
 * tokenBlacklist.js
 * Redis-backed JWT token blacklist with graceful in-memory fallback.
 * If Redis is unavailable, tokens are NOT revoked (fail-open for availability).
 */

const REDIS_URL = process.env.REDIS_URL || "";
const PREFIX = "blacklist:";

// In-memory fallback store (survives within a single process)
const memBlacklist = new Map();

let client = null;
let redisAvailable = false;

if (REDIS_URL) {
  try {
    const Redis = require("ioredis");
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy(times) {
        if (times > 3) return null; // give up after 3 retries
        return Math.min(times * 500, 2000);
      },
    });
    client.on("error", () => { redisAvailable = false; });
    client.on("connect", () => { redisAvailable = true; });
    client.connect().catch(() => { redisAvailable = false; });
  } catch (e) {
    console.warn("[tokenBlacklist] Redis init failed, using in-memory fallback");
  }
}

async function revokeToken(jti, exp) {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl <= 0) return;

  // Try Redis
  if (client && redisAvailable) {
    try {
      await client.set(`${PREFIX}${jti}`, "1", "EX", ttl);
      return;
    } catch (err) {
      console.warn("[tokenBlacklist] Redis set failed, using memory:", err.message);
    }
  }

  // In-memory fallback
  memBlacklist.set(jti, Date.now() + ttl * 1000);
}

async function isRevoked(jti) {
  // Try Redis
  if (client && redisAvailable) {
    try {
      const val = await client.get(`${PREFIX}${jti}`);
      return val === "1";
    } catch (err) {
      console.warn("[tokenBlacklist] Redis get failed, using memory:", err.message);
    }
  }

  // In-memory fallback
  const exp = memBlacklist.get(jti);
  if (!exp) return false;
  if (Date.now() > exp) {
    memBlacklist.delete(jti);
    return false;
  }
  return true;
}

module.exports = { revokeToken, isRevoked };
