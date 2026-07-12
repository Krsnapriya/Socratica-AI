const LANGUAGE_CONFIGS = {
  python: {
    ext: '.py',
    image: 'socratica/sandbox-python:latest',
    memoryMb: 256,
    cpuQuota: 50000,
    timeoutMs: 8000,
    compileTimeoutMs: 0,
    compile: null,
    run: 'python3 {file}',
  },
  cpp: {
    ext: '.cpp',
    image: 'socratica/sandbox-cpp:latest',
    memoryMb: 512,
    cpuQuota: 100000,
    timeoutMs: 12000,
    compileTimeoutMs: 15000,
    compile: 'g++ -std=c++17 -O2 -pipe -s {file} -o {bin}',
    run: './{bin}',
  },
  javascript: {
    ext: '.js',
    image: 'socratica/sandbox-javascript:latest',
    memoryMb: 256,
    cpuQuota: 50000,
    timeoutMs: 8000,
    compileTimeoutMs: 0,
    compile: null,
    run: 'node {file}',
  },
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIGS);

function getDockerRunArgs(lang) {
  const cfg = LANGUAGE_CONFIGS[lang];
  if (!cfg) throw new Error(`Unknown language: ${lang}`);
  return {
    image: cfg.image,
    memory: `${cfg.memoryMb}m`,
    memorySwap: `${cfg.memoryMb}m`,
    cpuQuota: cfg.cpuQuota,
    cpuPeriod: 100000,
    pidsLimit: 256,
    timeout: cfg.timeoutMs,
    compileTimeout: cfg.compileTimeoutMs,
    extension: cfg.ext,
  };
}

module.exports = { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGES, getDockerRunArgs };
