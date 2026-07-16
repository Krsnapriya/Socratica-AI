const { config } = require("../configLoader");

const LANGUAGE_CONFIGS = {};
for (const [lang, cfg] of Object.entries(config.sandbox.languages)) {
  LANGUAGE_CONFIGS[lang] = { ...cfg };
}

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIGS);

function getDockerRunArgs(lang) {
  const cfg = LANGUAGE_CONFIGS[lang];
  if (!cfg) throw new Error(`Unknown language: ${lang}`);
  return {
    image: cfg.image,
    memory: `${cfg.memoryMb}m`,
    memorySwap: `${cfg.memoryMb}m`,
    cpuQuota: cfg.cpuQuota,
    cpuPeriod: config.sandbox.cpuPeriod,
    pidsLimit: config.sandbox.pidsLimit,
    timeout: cfg.timeoutMs,
    compileTimeout: cfg.compileTimeoutMs,
    extension: cfg.ext,
  };
}

module.exports = { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGES, getDockerRunArgs };
