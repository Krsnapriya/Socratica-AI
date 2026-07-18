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

  const { wrapperType, driverCode, functionName } = driverConfig;

  // stdin_stdout mode: student code reads from stdin directly, no driver injection
  if (wrapperType === "stdin_stdout") {
    return studentCode;
  }

  // function_call mode: generate stdin-based wrapper instead of using hardcoded driver
  if (wrapperType === "function_call" && functionName) {
    return buildStdinWrapper(studentCode, functionName, language);
  }

  // C++ specific wrapping
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

  // Python/JavaScript: append driver after student code
  return studentCode + "\n" + driverCode + "\n";
}

function buildStdinWrapper(studentCode, functionName, language) {
  if (language === "python") {
    return studentCode + "\n\n" +
      "import sys\n" +
      "import json\n" +
      "import ast\n\n" +
      "def main():\n" +
      "    data = sys.stdin.read().strip()\n" +
      "    if not data:\n" +
      "        return\n" +
      "    try:\n" +
      "        args = json.loads(data)\n" +
      "    except json.JSONDecodeError:\n" +
      "        try:\n" +
      "            args = ast.literal_eval(data)\n" +
      "        except:\n" +
      "            args = [x.strip() for x in data.split(",")]\n" +
      "    if not isinstance(args, (list, tuple)):\n" +
      "        args = [args]\n" +
      "    result = " + functionName + "(*args)\n" +
      "    print(result)\n\n" +
      "if __name__ == \"__main__\":\n" +
      "    main()\n";
  }
  if (language === "javascript") {
    return studentCode + "\n\n" +
      "const fs = require('fs');\n" +
      "function main() {\n" +
      "    const data = fs.readFileSync(0, 'utf-8').trim();\n" +
      "    if (!data) return;\n" +
      "    let args;\n" +
      "    try {\n" +
      "        args = JSON.parse(data);\n" +
      "    } catch {\n" +
      "        try {\n" +
      "            args = eval(data);\n" +
      "        } catch {\n" +
      "            args = data.split(',').map(x => x.trim());\n" +
      "        }\n" +
      "    }\n" +
      "    if (!Array.isArray(args)) args = [args];\n" +
      "    const result = " + functionName + "(...args);\n" +
      "    console.log(result);\n" +
      "}\n" +
      "main();\n";
  }
  if (language === "cpp") {
    return studentCode + "\n\n" +
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n\n" +
      "int main() {\n" +
      "    string input;\n" +
      "    getline(cin, input);\n" +
      "    if (input.empty()) return 0;\n" +
      "    // For C++, we expect the input to be space-separated values\n" +
      "    // This is a simplified parser - real usage would need proper parsing\n" +
      "    // For now, just call the function with empty args (placeholder)\n" +
      "    // TODO: Implement proper stdin parsing for C++\n" +
      "    return 0;\n" +
      "}\n";
  }
  // Fallback: append driver code
  return studentCode + "\n" + driverCode + "\n";
}

// ── Unified container execution ────────────────────────────────────────────
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

  return runContainer({ image: dockerArgs.image, envVars, memoryMb, dockerArgs, timeLimitMs: finalTimeLimit });
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

  return runContainer({ image: dockerArgs.image, envVars, memoryMb, dockerArgs, timeLimitMs: finalTimeLimit });
}

// ── Shared container runner (eliminates duplication) ───────────────────────
async function runContainer({ image, envVars, memoryMb, dockerArgs, timeLimitMs }) {
  let container;
  try {
    container = await docker.createContainer(createContainerConfig({
      image, envVars, memoryMb, dockerArgs,
    }));
    await container.start();

    const timeoutMs = timeLimitMs + config.sandbox.graceTimeoutMs;
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
    return parsed;
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
  let stderr = "";
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
    else {
      stderr = err.stderr?.toString()?.slice(0, 500) || "";
      error = err.status === 1 ? "compile_error" : (stderr || err.message);
    }
  }

  const elapsed = Date.now() - start;

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}

  return { stdout, stderr, error, elapsed_ms: elapsed, max_memory_bytes: 0, exit_code: error ? 1 : 0 };
}

module.exports = { executeInContainer, executeWithOracle, buildStudentCodeWithDriver, runFallback };
