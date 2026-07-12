/**
 * Oracle Verification script — Socratica AI
 * Verifies that all oracle solutions compile, run, and complete successfully.
 * Updates the 'oracleVerified' flags in MongoDB.
 * Usage: node scripts/verifyOracles.js
 */

const mongoose = require("mongoose");
const Problem = require("../server/models/Problem");
const runInContainer = require("../server/sandbox/runInContainer");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

async function verify() {
  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB");

  const problems = await Problem.find({});
  console.log(`Verifying ${problems.length} problems...`);

  let overallSuccess = true;

  for (const prob of problems) {
    console.log(`\nEvaluating problem: ${prob.problemId}`);
    
    for (const lang of ["python", "cpp", "javascript"]) {
      const code = prob.oracleSolutions[lang];
      if (!code) {
        console.log(`  - ${lang.padEnd(10)}: No oracle solution found.`);
        continue;
      }

      console.log(`  - ${lang.padEnd(10)}: Running sandbox...`);
      try {
        const result = await runInContainer({
          studentCode: code,
          oracleCode: code,
          problemId: prob.problemId,
          language: lang
        });

        const student = result.student || {};
        
        if (student.error) {
          console.error(`    ✗ Failed: ${student.error}`);
          if (student.stderr) console.error(`      Stderr: ${student.stderr}`);
          prob.oracleVerified[lang] = false;
          overallSuccess = false;
        } else {
          console.log(`    ✓ Passed (${student.elapsed_ms || 0} ms)`);
          prob.oracleVerified[lang] = true;
        }
      } catch (err) {
        console.error(`    ✗ Container failure: ${err.message}`);
        prob.oracleVerified[lang] = false;
        overallSuccess = false;
      }
    }

    await prob.save();
  }

  await mongoose.disconnect();
  console.log("\n------------------------------------------------");
  if (overallSuccess) {
    console.log("✓ All oracle solutions verified successfully!");
    process.exit(0);
  } else {
    console.error("✗ Some oracle solutions failed verification!");
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error("✗ Verification failed:", err.message);
  process.exit(1);
});
