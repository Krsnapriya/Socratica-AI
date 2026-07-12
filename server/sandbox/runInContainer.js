const Docker = require("dockerode");
const { getDockerRunArgs } = require("./languageConfigs");
const { injectDriver } = require("./problemDrivers");

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const DOCKER_HOST = process.env.DOCKER_HOST || null;

let docker = null;
try {
  docker = DOCKER_HOST
    ? new Docker({ host: DOCKER_HOST.split(":")[0], port: parseInt(DOCKER_HOST.split(":")[1]) })
    : new Docker({ socketPath: DOCKER_SOCKET });
} catch (err) {
  console.warn("[sandbox] Docker unavailable:", err.message);
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

async function runInContainer({ studentCode, oracleCode, problemId, language }) {
  if (!docker) throw new Error("system_judge_error");
  if (!studentCode || studentCode.trim().length === 0) throw new Error("Empty submission rejected");
  if (!oracleCode) throw new Error("Missing oracle solution");

  const dockerArgs = getDockerRunArgs(language);
  const studentCodeWithDriver = injectDriver(studentCode, problemId, language);

  const studentB64 = Buffer.from(studentCodeWithDriver).toString("base64");
  const oracleB64 = Buffer.from(oracleCode).toString("base64");

  const envVars = [
    `STUDENT_CODE_B64=${studentB64}`,
    `ORACLE_CODE_B64=${oracleB64}`,
    `LANGUAGE=${language}`,
    `TIMEOUT_MS=${dockerArgs.timeout}`,
    `MEMORY_MB=${dockerArgs.memory.replace('m', '')}`,
    `COMPILE_TIMEOUT_MS=${dockerArgs.compileTimeout}`,
  ];

  let container;
  try {
    container = await docker.createContainer({
      Image: dockerArgs.image,
      Env: envVars,
      HostConfig: {
        Memory: parseInt(dockerArgs.memory) * 1024 * 1024,
        MemorySwap: parseInt(dockerArgs.memorySwap) * 1024 * 1024,
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
      setTimeout(() => rej(new Error("container_timeout")), dockerArgs.timeout + 3000)
    );
    await Promise.race([waitPromise, timeoutPromise]);

    const logsBuffer = await container.logs({ stdout: true, stderr: false, follow: false });
    const rawOutput = demuxDockerStream(logsBuffer).toString("utf8").trim();

    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch (err) {
      console.error("[runInContainer] Failed to parse output:", rawOutput.slice(0, 300));
      throw new Error("Sandbox output parse error");
    }

    return parsed;
  } catch (err) {
    if (err.message === "container_timeout") throw new Error("container_timeout");
    if (err.message === "Empty submission rejected") throw err;
    console.error("[runInContainer] Docker exception:", err);
    throw new Error("system_judge_error");
  } finally {
    if (container) {
      try { await container.remove({ force: true }); } catch (_) {}
    }
  }
}

module.exports = runInContainer;
