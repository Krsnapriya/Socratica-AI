require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("./models/Course");
const Module = require("./models/Module");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

const newModules = [
  {
    title: "Trees & Binary Trees",
    description: "Binary tree traversals, BST validation, and tree-based algorithms.",
    order: 5,
    topics: [
      { title: "Binary Tree Inorder Traversal", problemId: "binary-tree-inorder" },
      { title: "Validate Binary Search Tree", problemId: "validate-bst" }
    ],
    prerequisites: [] // No prerequisites - can start immediately
  },
  {
    title: "Graph Algorithms",
    description: "Graph traversal, flood fill, topological sorting, and cycle detection.",
    order: 6,
    topics: [
      { title: "Number of Islands", problemId: "number-of-islands" },
      { title: "Course Schedule", problemId: "course-schedule" }
    ],
    prerequisites: [] // Can be taken independently
  },
  {
    title: "Advanced Data Structures",
    description: "Heaps, LRU caches, and advanced data structure design problems.",
    order: 7,
    topics: [
      { title: "Merge k Sorted Lists", problemId: "merge-k-sorted-lists" },
      { title: "LRU Cache", problemId: "lru-cache" }
    ],
    prerequisites: [] // Can be taken independently
  },
  {
    title: "Advanced Algorithms",
    description: "Stack-based algorithms, dynamic programming optimization, backtracking, and binary search on answer.",
    order: 8,
    topics: [
      { title: "Trapping Rain Water", problemId: "trapping-rain-water" },
      { title: "Word Break", problemId: "word-break" },
      { title: "N-Queens", problemId: "n-queens" },
      { title: "Median of Two Sorted Arrays", problemId: "median-of-two-sorted-arrays" }
    ],
    prerequisites: [] // Can be taken independently
  }
];

async function seedModules() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const course = await Course.findOne({ title: "Core Computer Science" });
    if (!course) {
      console.error("Course not found! Run seed.js first.");
      return;
    }

    let created = 0;
    for (const mod of newModules) {
      const existing = await Module.findOne({ title: mod.title });
      if (!existing) {
        const newModule = await Module.create({
          ...mod,
          course: course._id
        });
        console.log(`Created module: ${mod.title} (${mod.topics.length} problems)`);
        created++;
      } else {
        console.log(`Module already exists: ${mod.title}`);
      }
    }

    // Update course modules list
    const allModules = await Module.find({ course: course._id }).sort({ order: 1 });
    course.modules = allModules.map(m => m._id);
    await course.save();
    console.log(`\nUpdated course with ${allModules.length} modules total`);

    console.log(`\nDone — ${created} new modules created`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedModules();