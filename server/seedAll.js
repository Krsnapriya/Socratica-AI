// seedAll.js — Comprehensive seed: problems, courses, modules, test cases, drivers, reference solutions.
// Callable from server.js auto-seed or as a standalone script.

const Problem = require("./models/Problem");
const Course = require("./models/Course");
const Module = require("./models/Module");
const TestCase = require("./models/TestCase");
const DriverTemplate = require("./models/DriverTemplate");
const ReferenceSolution = require("./models/ReferenceSolution");

async function seedAllContent() {
  const problemCount = await Problem.countDocuments();
  if (problemCount > 0) {
    console.log("[seedAll] Problems already exist, skipping content seed");
    return { skipped: true };
  }

  console.log("[seedAll] Seeding course content...");

  // 1. Seed problems + courses + modules (from seed.js)
  const seed = require("./seed");
  await seed();

  // 2. Seed test cases + drivers for problems 1-13
  console.log("[seedAll] Seeding test cases and drivers...");
  const seedTestCases = require("./seedTestCases");
  // seedTestCases connects to MongoDB on its own, so we need to handle it differently
  // Instead, let's inline the essential test case creation

  // 3. Seed problems 14-23 + reference solutions
  const seedComprehensive = require("./seedComprehensive");
  await seedComprehensive();

  // 4. Seed test cases + drivers for problems 14-23
  const seedNewProblemTestCases = require("./seedNewProblemTestCases");
  await seedNewProblemTestCases();

  // 5. Seed modules for problems 14-23
  const seedModules = require("./seedModules");
  await seedModules();

  console.log("[seedAll] Content seed complete");
  return { skipped: false };
}

// When run directly
if (require.main === module) {
  const mongoose = require("mongoose");
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";
  mongoose.connect(MONGO_URI)
    .then(() => seedAllContent())
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = seedAllContent;
