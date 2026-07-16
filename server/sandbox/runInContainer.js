const { executeWithOracle, buildStudentCodeWithDriver } = require("../engine/sandbox");
const { getDockerRunArgs } = require("./languageConfigs");
const { injectDriver } = require("./problemDrivers");

/**
 * Legacy wrapper — delegates to engine/sandbox.js
 * Kept for backward compatibility with routes/submissions.js
 */
async function runInContainer({ studentCode, oracleCode, problemId, language }) {
  const dockerArgs = getDockerRunArgs(language);
  const codeWithDriver = buildStudentCodeWithDriver(studentCode, {
    wrapperType: "function_call",
    driverCode: injectDriver(studentCode, problemId, language),
  }, language);

  return executeWithOracle({
    studentCode: codeWithDriver,
    oracleCode,
    language,
    timeLimitMs: dockerArgs.timeout,
    memoryLimitMb: parseInt(dockerArgs.memory),
    compileTimeoutMs: dockerArgs.compileTimeout,
  });
}

module.exports = runInContainer;
