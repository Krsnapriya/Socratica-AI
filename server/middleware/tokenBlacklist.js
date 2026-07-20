/**
 * tokenBlacklist.js
 * Redis-backed JWT token blacklist.
 * Revoked tokens are stored with a TTL equal to their remaining validity
 * so the set never grows unbounded.
 */

const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const PREFIX = "blacklist:";

let client = null;

function getClient() {
  if (client) return client;
  client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 3000,
    retryStrategy(times) {
      return Math.min(times * 200, 2000); // fast backoff, give up quickly
    },
  });
  client.on("error", (err) => {
    console.error("[tokenBlacklist] Redis error:", err.message);
  });
  return client;
}

/**
 * Add a token to the blacklist.
 * @param {string} jti   - JWT ID (or the raw token string used as key)
 * @param {number} exp   - JWT exp claim (Unix seconds)
 */
async function revokeToken(jti, exp) {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl <= 0) return; // already expired — nothing to do
  try {
    await getClient().set(`${PREFIX}${jti}`, "1", "EX", ttl);
  } catch (err) {
    console.error("[tokenBlacklist] Failed to revoke token:", err.message);
    throw new Error("Token validation service unavailable");
  }
}

/**
 * Check whether a token has been revoked.
 * Fails CLOSED (throws) if Redis is unavailable. requireAuth catches gracefully.
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
async function isRevoked(jti) {
  try {
    const val = await getClient().get(`${PREFIX}${jti}`);
    return val === "1";
  } catch (err) {
    console.error("[tokenBlacklist] Redis unavailable:", err.message);
    throw new Error("Token validation unavailable");
  }
}

module.exports = { revokeToken, isRevoked };
