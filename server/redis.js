// Redis Client — shared Redis connection with graceful in-memory fallback.
// If REDIS_URL is not set, all operations fall back to in-memory Maps.
// This allows rate limits, locks, circuit breaker, and cache to work across
// multiple server instances when Redis is available.

const Redis = require("ioredis");
const config = require("./config");

const REDIS_URL = process.env.REDIS_URL || "";
const PREFIX = process.env.REDIS_PREFIX || "socratica:";

let redis = null;
let useRedis = false;

// ── Connection ───────────────────────────────────────────────────────────
if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL, {
      keyPrefix: PREFIX,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      if (useRedis) {
        console.error("[redis] Error, falling back to in-memory:", err.message);
        useRedis = false;
      }
    });

    redis.on("connect", () => {
      useRedis = true;
      console.log("[redis] Connected");
    });

    redis.connect().catch(() => {
      console.log("[redis] Connection failed, using in-memory fallback");
    });
  } catch {
    console.log("[redis] Failed to create client, using in-memory fallback");
  }
}

// ── In-Memory Fallback ──────────────────────────────────────────────────
const memStore = new Map(); // key -> { value, expiresAt }

function memGet(key) {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key, value, ttlMs) {
  memStore.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : null });
}

function memDel(key) {
  memStore.delete(key);
}

function memIncr(key, ttlMs) {
  const entry = memStore.get(key);
  if (!entry || (entry.expiresAt && Date.now() > entry.expiresAt)) {
    const val = 1;
    memStore.set(key, { value: val, expiresAt: ttlMs ? Date.now() + ttlMs : null });
    return val;
  }
  entry.value++;
  return entry.value;
}

function memSetNX(key, value, ttlMs) {
  const existing = memGet(key);
  if (existing !== null) return false;
  memSet(key, value, ttlMs);
  return true;
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Get a value by key.
 */
async function get(key) {
  if (useRedis && redis) {
    try { return await redis.get(key); } catch { return null; }
  }
  return memGet(key);
}

/**
 * Set a value with optional TTL in ms.
 */
async function set(key, value, ttlMs) {
  if (useRedis && redis) {
    try {
      if (ttlMs) {
        await redis.set(key, value, "PX", ttlMs);
      } else {
        await redis.set(key, value);
      }
      return;
    } catch { /* fall through to in-memory */ }
  }
  memSet(key, value, ttlMs);
}

/**
 * Delete a key.
 */
async function del(key) {
  if (useRedis && redis) {
    try { await redis.del(key); return; } catch { /* fall through */ }
  }
  memDel(key);
}

/**
 * Increment a counter with optional TTL (set only on first increment).
 * Returns the new value.
 */
async function incr(key, ttlMs) {
  if (useRedis && redis) {
    try {
      const val = await redis.incr(key);
      if (val === 1 && ttlMs) {
        await redis.pexpire(key, ttlMs);
      }
      return val;
    } catch { /* fall through */ }
  }
  return memIncr(key, ttlMs);
}

/**
 * Set if not exists (atomic). Returns true if set, false if already exists.
 */
async function setNX(key, value, ttlMs) {
  if (useRedis && redis) {
    try {
      const result = await redis.set(key, value, "PX", ttlMs, "NX");
      return result === "OK";
    } catch { /* fall through */ }
  }
  return memSetNX(key, value, ttlMs);
}

/**
 * Check if Redis is connected and healthy.
 */
function isConnected() {
  return useRedis && redis?.status === "ready";
}

module.exports = { get, set, del, incr, setNX, isConnected };
