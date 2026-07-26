/**
 * Socratica AI — Shared Language Configurations
 * Single source of truth for per-language sandbox limits.
 * Used by both gateway (deployment) and sandbox (entrypoint.sh via env).
 */

// Per-language sandbox limits calibrated against oracle solutions
const LANGUAGE_CONFIGS = {
  python:     { ext: ".py",   memoryMb: 256, cpuQuota: 50000,  timeoutMs: 8000,  compileTimeoutMs: 10000, image: "socratica/sandbox-python:latest" },
  javascript: { ext: ".js",   memoryMb: 256, cpuQuota: 50000,  timeoutMs: 8000,  compileTimeoutMs: 0,     image: "socratica/sandbox-javascript:latest" },
  cpp:        { ext: ".cpp",  memoryMb: 512, cpuQuota: 100000, timeoutMs: 12000, compileTimeoutMs: 15000, image: "socratica/sandbox-cpp:latest" },
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIGS);

// Exported for CommonJS (gateway) and ESM (if needed)
module.exports = { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGES };

// Helper to generate docker run args from config
function getDockerRunArgs(lang) {
  const cfg = LANGUAGE_CONFIGS[lang];
  if (!cfg) {
    throw new Error(`Unknown language: ${lang}`);
  }
  return {
    memory: `${cfg.memoryMb}m`,
    memorySwap: `${cfg.memoryMb}m`,
    cpuQuota: cfg.cpuQuota,
    cpuPeriod: 100000,
    pidsLimit: 256,
    timeout: cfg.timeoutMs,
    compileTimeout: cfg.compileTimeoutMs,
    // Extension for entrypoint.sh to use
    extension: cfg.ext,
    image: cfg.image,
  };
}

module.exports.getDockerRunArgs = getDockerRunArgs;
module.exports.LANGUAGE_CONFIGS = LANGUAGE_CONFIGS;
module.exports.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;