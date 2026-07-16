// Seed Languages — populates Language collection with default sandbox configs.
const Language = require("./models/Language");

const DEFAULT_LANGUAGES = [
  {
    id: "python",
    label: "Python 3",
    ext: ".py",
    image: "socratica/sandbox-python:latest",
    memoryMb: 256,
    cpuQuota: 50000,
    timeoutMs: 8000,
    compileTimeoutMs: 0,
    compile: null,
    run: "python3 {file}",
    order: 0,
  },
  {
    id: "cpp",
    label: "C++17",
    ext: ".cpp",
    image: "socratica/sandbox-cpp:latest",
    memoryMb: 512,
    cpuQuota: 100000,
    timeoutMs: 12000,
    compileTimeoutMs: 15000,
    compile: "g++ -std=c++17 -O2 -pipe -s {file} -o {bin}",
    run: "./{bin}",
    order: 1,
  },
  {
    id: "javascript",
    label: "JavaScript (Node)",
    ext: ".js",
    image: "socratica/sandbox-javascript:latest",
    memoryMb: 256,
    cpuQuota: 50000,
    timeoutMs: 8000,
    compileTimeoutMs: 0,
    compile: null,
    run: "node {file}",
    order: 2,
  },
];

async function seedLanguages() {
  let created = 0;
  let updated = 0;

  for (const lang of DEFAULT_LANGUAGES) {
    const existing = await Language.findOne({ id: lang.id });
    if (existing) {
      await Language.updateOne({ id: lang.id }, { $set: lang });
      updated++;
    } else {
      await Language.create(lang);
      created++;
    }
  }

  console.log(`[seedLanguages] Created: ${created}, Updated: ${updated}`);
  return { created, updated };
}

module.exports = seedLanguages;
