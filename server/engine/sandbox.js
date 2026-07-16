const Docker = require("dockerode");
const { getDockerRunArgs } = require("../sandbox/languageConfigs");
const { config } = require("../configLoader");

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

function demuxDockerStream(buffer, streamType) {
  let offset = 0;
  const chunks = [];
  while (offset + 8 <= buffer.length) {
    const type = buffer.readUInt8(offset);
    const size = buffer.readUInt32BE(offset + 4);
    const frameEnd = offset + 8 + size;
    if (type === streamType) {
      if (frameEnd <= buffer.length) {
        chunks.push(buffer.subarray(offset + 8, frameEnd));
      }
    }
    offset = frameEnd > offset ? frameEnd : offset + 1;
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

async function fetchContainerLogs(container) {
  const logsBuffer = await container.logs({ stdout: true, stderr: true, follow: false, });
  const stdoutText = demuxDockerStream(logsBuffer, 1);
  const stderrText = demuxDockerStream(logsBuffer, 2);
  return { stdoutText, stderrText };
}

function parseContainerOutput(stdoutText, stderrText) {
  const candidates = [stdoutText, stderrText];
  for (const text of candidates) {
    if (!text) continue;
    const lastBrace = text.lastIndexOf("}");
    if (lastBrace === -1) continue;
    const trimmed = text.slice(0, lastBrace + 1);
    const firstBrace = trimmed.indexOf("{");
    if (firstBrace === -1) continue;
    const candidate = trimmed.slice(firstBrace);
    try {
      return JSON.parse(candidate);
    } catch (_) {}
  }
  return null;
}

function createContainerConfig({ image, envVars, memoryMb, dockerArgs }) {
  return {
    Image: image,
    Env: envVars,
    AttachStdout: true,
    AttachStderr: true,
    HostConfig: {
      Memory: memoryMb * 1024 * 1024,
      MemorySwap: memoryMb * 1024 * 1024,
      CpuQuota: dockerArgs.cpuQuota,
      CpuPeriod: dockerArgs.cpuPeriod,
      PidsLimit: dockerArgs.pidsLimit,
      NetworkMode: "none",
      ReadonlyRootfs: true,
      SecurityOpt: ["no-new-privileges:true"],
      CapDrop: ["ALL"],
      Tmpfs: { "/tmp": `rw,exec,nosuid,size=${config.sandbox.tmpfsSizeMb}m` },
      OomKillDisable: false,
    },
    User: config.sandbox.containerUser,
  };
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
  const memoryMb = memoryLimitMb || parseInt(dockerArgs.memory);

  const codeB64 = Buffer.from(code).toString("base64");
  const stdinB64 = stdin ? Buffer.from(stdin).toString("base64") : "";

  const envVars = [
    `STUDENT_CODE_B64=${codeB64}`,
    `ORACLE_CODE_B64=`,
    `LANGUAGE=${language}`,
    `TIMEOUT_MS=${finalTimeLimit}`,
    `MEMORY_MB=${memoryMb}`,
    `COMPILE_TIMEOUT_MS=${compileTimeoutMs || dockerArgs.compileTimeout}`,
    `EXEC_MODE=single`,
  ];

  if (stdinB64) {
    envVars.push(`CUSTOM_INPUT_B64=${stdinB64}`);
  }

  let container;
  try {
    container = await docker.createContainer(createContainerConfig({
      image: dockerArgs.image, envVars, memoryMb, dockerArgs,
    }));
    await container.start();

    const timeoutMs = finalTimeLimit + config.sandbox.graceTimeoutMs;
    await Promise.race([
      container.wait(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("container_timeout")), timeoutMs)),
    ]);

    const { stdoutText, stderrText } = await fetchContainerLogs(container);
    const parsed = parseContainerOutput(stdoutText, stderrText);
    if (!parsed) {
      console.error("[engine] Sandbox parse failed. stdout:", stdoutText.slice(0, 200), "stderr:", stderrText.slice(0, 100));
      throw new Error("Sandbox output parse error");
    }
    return parsed.student || parsed;
  } catch (err) {
    if (err.message === "container_timeout") throw new Error("container_timeout");
    if (err.message === "Sandbox output parse error") throw err;
    console.error("[engine] Docker exception:", err.message || err);
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
  const memoryMb = memoryLimitMb || parseInt(dockerArgs.memory);

  const studentB64 = Buffer.from(studentCode).toString("base64");
  const oracleB64 = Buffer.from(oracleCode).toString("base64");
  const stdinB64 = stdin ? Buffer.from(stdin).toString("base64") : "";

  const envVars = [
    `STUDENT_CODE_B64=${studentB64}`,
    `ORACLE_CODE_B64=${oracleB64}`,
    `LANGUAGE=${language}`,
    `TIMEOUT_MS=${finalTimeLimit}`,
    `MEMORY_MB=${memoryMb}`,
    `COMPILE_TIMEOUT_MS=${compileTimeoutMs || dockerArgs.compileTimeout}`,
    `EXEC_MODE=dual`,
  ];

  if (stdinB64) {
    envVars.push(`CUSTOM_INPUT_B64=${stdinB64}`);
  }

  let container;
  try {
    container = await docker.createContainer(createContainerConfig({
      image: dockerArgs.image, envVars, memoryMb, dockerArgs,
    }));
    await container.start();

    const timeoutMs = finalTimeLimit + config.sandbox.graceTimeoutMs;
    await Promise.race([
      container.wait(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("container_timeout")), timeoutMs)),
    ]);

    const { stdoutText, stderrText } = await fetchContainerLogs(container);
    const parsed = parseContainerOutput(stdoutText, stderrText);
    if (!parsed) {
      console.error("[engine] Oracle parse failed. stdout:", stdoutText.slice(0, 200), "stderr:", stderrText.slice(0, 100));
      throw new Error("Sandbox output parse error");
    }
    return parsed;
  } catch (err) {
    if (err.message === "container_timeout") throw new Error("container_timeout");
    if (err.message === "Sandbox output parse error") throw err;
    console.error("[engine] Docker oracle exception:", err.message || err);
    throw new Error("system_judge_error");
  } finally {
    if (container) {
      try { await container.remove({ force: true }); } catch (_) {}
    }
  }
}

async function runFallback({ code, language, stdin, timeLimitMs }) {
  const { execSync } = require("child_process");
  const fs = require("fs");
  const path = require("path");
  const os = require("os");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "socratica-fb-"));
  const ext = { python: ".py", javascript: ".js", cpp: ".cpp" }[language] || ".txt";
  const codeFile = path.join(tmpDir, `solution${ext}`);

  let codeToRun = code;
  if (language === "cpp") {
    const hasInclude = code.includes("#include");
    const hasMain = code.includes("int main");
    if (!hasInclude) codeToRun = "#include <bits/stdc++.h>\nusing namespace std;\n" + code;
    if (!hasMain) codeToRun += "\nint main() { return 0; }\n";
  }

  fs.writeFileSync(codeFile, codeToRun);

  const timeout = Math.min(timeLimitMs || 10000, 10000);
  const start = Date.now();
  let stdout = "";
  let error = null;

  try {
    if (language === "python") {
      const cmd = stdin
        ? `echo ${Buffer.from(stdin).toString("base64")} | base64 -d | python3 ${codeFile}`
        : `python3 ${codeFile}`;
      stdout = execSync(cmd, { timeout, maxBuffer: 1024 * 1024 }).toString().trim();
    } else if (language === "javascript") {
      const cmd = stdin
        ? `echo ${Buffer.from(stdin).toString("base64")} | base64 -d | node ${codeFile}`
        : `node ${codeFile}`;
      stdout = execSync(cmd, { timeout, maxBuffer: 1024 * 1024 }).toString().trim();
    } else if (language === "cpp") {
      const outBin = path.join(tmpDir, "solution");
      execSync(`g++ -o ${outBin} ${codeFile} -std=c++17`, { timeout: 10000 });
      const cmd = stdin
        ? `echo ${Buffer.from(stdin).toString("base64")} | base64 -d | ${outBin}`
        : outBin;
      stdout = execSync(cmd, { timeout, maxBuffer: 1024 * 1024 }).toString().trim();
    }
  } catch (err) {
    if (err.killed) error = "timeout";
    else if (err.status === 137) error = "oom";
    else error = err.stderr?.toString()?.slice(0, 500) || err.message;
  }

  const elapsed = Date.now() - start;

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}

  return { stdout, error, elapsed_ms: elapsed, max_memory_bytes: 0 };
}

module.exports = { executeInContainer, executeWithOracle, buildStudentCodeWithDriver, runFallback };
