const Docker = require("dockerode");
const { getDockerRunArgs } = require("../sandbox/languageConfigs");

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const DOCKER_HOST = process.env.DOCKER_HOST || null;

let docker = null;
try {
  docker = DOCKER_HOST
    ? new Docker({ host: DOCKER_HOST.split(":")[0], port: parseInt(DOCKER_HOST.split(":")[1]) })
    : new Docker({ socketPath: DOCKER_SOCKET });
} catch (err) {
  console.warn("[engine] Docker unavailable:", err.message);
}

function demuxDockerStream(buffer) {
  let offset = 0;
  const chunks = [];
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;
    const size = buffer.readUInt32BE(offset + 4);
    if (offset + 8 + size > buffer.length) {
      chunks.push(buffer.subarray(offset + 8));
      break;
    }
    chunks.push(buffer.subarray(offset + 8, offset + 8 + size));
    offset += 8 + size;
  }
  return Buffer.concat(chunks);
}

function buildStudentCodeWithDriver(studentCode, driverConfig, language) {
  if (!driverConfig || !driverConfig.driverCode) return studentCode;

  const { wrapperType, driverCode } = driverConfig;

  if (wrapperType === "stdin_stdout") {
    return studentCode;
  }

  if (language === "cpp") {
    const hasInclude = studentCode.includes("#include");
    const hasMain = studentCode.includes("int main");
    let result = "";
    if (!hasInclude) result += "#include <bits/stdc++.h>\nusing namespace std;\n";
    result += studentCode;
    if (!hasMain) {
      result += "\nint main() {\n" + driverCode + "\n}\n";
    } else {
      result += "\n" + driverCode + "\n";
    }
    return result;
  }

  return studentCode + "\n" + driverCode + "\n";
}

async function executeInContainer({ code, language, stdin, timeLimitMs, memoryLimitMb, compileTimeoutMs }) {
  if (!docker) throw new Error("system_judge_error");
  if (!code || code.trim().length === 0) throw new Error("Empty submission rejected");

  const dockerArgs = getDockerRunArgs(language);
  const finalTimeLimit = timeLimitMs || dockerArgs.timeout;
  const finalMemory = memoryLimitMb ? `${memoryLimitMb}m` : dockerArgs.memory;
  finalMemory.replace('m', '');

  const codeB64 = Buffer.from(code).toString("base64");
  const stdinB64 = stdin ? Buffer.from(stdin).toString("base64") : "";

  const envVars = [
    `STUDENT_CODE_B64=${codeB64}`,
    `ORACLE_CODE_B64=`,  // empty for run_code mode
    `LANGUAGE=${language}`,
    `TIMEOUT_MS=${finalTimeLimit}`,
    `MEMORY_MB=${(memoryLimitMb || parseInt(dockerArgs.memory))}`,
    `COMPILE_TIMEOUT_MS=${compileTimeoutMs || dockerArgs.compileTimeout}`,
    `EXEC_MODE=single`,
  ];

  if (stdinB64) {
    envVars.push(`CUSTOM_INPUT_B64=${stdinB64}`);
  }

  let container;
  try {
    container = await docker.createContainer({
      Image: dockerArgs.image,
      Env: envVars,
      HostConfig: {
        Memory: (memoryLimitMb || parseInt(dockerArgs.memory)) * 1024 * 1024,
        MemorySwap: (memoryLimitMb || parseInt(dockerArgs.memory)) * 1024 * 1024,
        CpuQuota: dockerArgs.cpuQuota,
        CpuPeriod: dockerArgs.cpuPeriod,
        PidsLimit: dockerArgs.pidsLimit,
        NetworkMode: "none",
        ReadonlyRootfs: true,
        SecurityOpt: ["no-new-privileges:true"],
        CapDrop: ["ALL"],
        Tmpfs: { "/tmp": "rw,exec,nosuid,size=64m" },
        OomKillDisable: false,
      },
      User: "1000:1000",
    });

    await container.start();

    const waitPromise = container.wait();
    const timeoutPromise = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("container_timeout")), finalTimeLimit + 5000)
    );
    await Promise.race([waitPromise, timeoutPromise]);

    const logsBuffer = await container.logs({ stdout: true, stderr: false, follow: false });
    const rawOutput = demuxDockerStream(logsBuffer).toString("utf8").trim();

    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch (err) {
      console.error("[engine] Failed to parse output:", rawOutput.slice(0, 300));
      throw new Error("Sandbox output parse error");
    }

    return parsed;
  } catch (err) {
    if (err.message === "container_timeout") throw new Error("container_timeout");
    console.error("[engine] Docker exception:", err);
    throw new Error("system_judge_error");
  } finally {
    if (container) {
      try { await container.remove({ force: true }); } catch (_) {}
    }
  }
}

async function executeWithOracle({ studentCode, oracleCode, language, stdin, timeLimitMs, memoryLimitMb, compileTimeoutMs }) {
  if (!docker) throw new Error("system_judge_error");
  if (!studentCode || studentCode.trim().length === 0) throw new Error("Empty submission rejected");
  if (!oracleCode) throw new Error("Missing oracle solution");

  const dockerArgs = getDockerRunArgs(language);
  const finalTimeLimit = timeLimitMs || dockerArgs.timeout;
  const finalMemoryMb = memoryLimitMb || parseInt(dockerArgs.memory);

  const studentB64 = Buffer.from(studentCode).toString("base64");
  const oracleB64 = Buffer.from(oracleCode).toString("base64");
  const stdinB64 = stdin ? Buffer.from(stdin).toString("base64") : "";

  const envVars = [
    `STUDENT_CODE_B64=${studentB64}`,
    `ORACLE_CODE_B64=${oracleB64}`,
    `LANGUAGE=${language}`,
    `TIMEOUT_MS=${finalTimeLimit}`,
    `MEMORY_MB=${finalMemoryMb}`,
    `COMPILE_TIMEOUT_MS=${compileTimeoutMs || dockerArgs.compileTimeout}`,
    `EXEC_MODE=dual`,
  ];

  if (stdinB64) {
    envVars.push(`CUSTOM_INPUT_B64=${stdinB64}`);
  }

  let container;
  try {
    container = await docker.createContainer({
      Image: dockerArgs.image,
      Env: envVars,
      HostConfig: {
        Memory: finalMemoryMb * 1024 * 1024,
        MemorySwap: finalMemoryMb * 1024 * 1024,
        CpuQuota: dockerArgs.cpuQuota,
        CpuPeriod: dockerArgs.cpuPeriod,
        PidsLimit: dockerArgs.pidsLimit,
        NetworkMode: "none",
        ReadonlyRootfs: true,
        SecurityOpt: ["no-new-privileges:true"],
        CapDrop: ["ALL"],
        Tmpfs: { "/tmp": "rw,exec,nosuid,size=64m" },
        OomKillDisable: false,
      },
      User: "1000:1000",
    });

    await container.start();

    const waitPromise = container.wait();
    const timeoutPromise = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("container_timeout")), finalTimeLimit + 5000)
    );
    await Promise.race([waitPromise, timeoutPromise]);

    const logsBuffer = await container.logs({ stdout: true, stderr: false, follow: false });
    const rawOutput = demuxDockerStream(logsBuffer).toString("utf8").trim();

    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch (err) {
      console.error("[engine] Failed to parse output:", rawOutput.slice(0, 300));
      throw new Error("Sandbox output parse error");
    }

    return parsed;
  } catch (err) {
    if (err.message === "container_timeout") throw new Error("container_timeout");
    console.error("[engine] Docker exception:", err);
    throw new Error("system_judge_error");
  } finally {
    if (container) {
      try { await container.remove({ force: true }); } catch (_) {}
    }
  }
}

module.exports = { executeInContainer, executeWithOracle, buildStudentCodeWithDriver };
