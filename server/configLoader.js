// ConfigLoader — Makes SystemConfig actually functional at runtime.
// Loads config from DB with in-memory cache + TTL, falls back to config.js defaults.

const defaults = require("./config");

let cache = {};
let cacheTimestamp = 0;
let loading = false;
let loadPromise = null;

const CACHE_TTL_MS = parseInt(process.env.CONFIG_CACHE_TTL) || 60000; // 60s

async function loadFromDB() {
  if (loading && loadPromise) return loadPromise;

  loading = true;
  loadPromise = (async () => {
    try {
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) {
        loading = false;
        return cache;
      }

      const SystemConfig = require("./models/SystemConfig");
      const configs = await SystemConfig.find().lean();

      const merged = JSON.parse(JSON.stringify(defaults)); // deep clone defaults

      for (const { key, value } of configs) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          merged[key] = { ...(merged[key] || {}), ...value };
        } else {
          merged[key] = value;
        }
      }

      cache = merged;
      cacheTimestamp = Date.now();
      loading = false;
      return cache;
    } catch (err) {
      console.error("[configLoader] Failed to load from DB:", err.message);
      loading = false;
      return cache || defaults;
    }
  })();

  return loadPromise;
}

function get(key, fallback) {
  // If cache is empty and DB hasn't been loaded yet, return defaults
  const now = Date.now();
  if (now - cacheTimestamp > CACHE_TTL_MS) {
    // Trigger async refresh (don't block)
    loadFromDB().catch(() => {});
  }

  if (key) {
    const parts = key.split(".");
    let val = cacheTimestamp > 0 ? cache : defaults;
    for (const p of parts) {
      val = val?.[p];
      if (val === undefined) break;
    }
    return val !== undefined ? val : fallback;
  }

  return cacheTimestamp > 0 ? cache : defaults;
}

function invalidate() {
  cacheTimestamp = 0;
  cache = {};
}

module.exports = { loadFromDB, get, invalidate, get config() { return get(); } };
