require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const config = require("./config");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27018/socratica";

const additionalStudents = [
  {
    email: "alice@example.com",
    displayName: "Alice Chen",
    bio: "Computer Science junior at Stanford. Passionate about algorithms and competitive programming.",
    role: "student",
    preferences: { language: "python", theme: "Socratica Dark", fontSize: "14px" },
    learningProfile: {
      skillLevel: "advanced",
      preferredStyle: "socratic",
      weakTopics: ["dynamic-programming", "graph-algorithms"],
      strongTopics: ["arrays", "strings", "trees", "recursion"],
      totalProblemsSolved: 45,
      totalSubmissions: 120,
      streakDays: 12,
      lastPracticeDate: new Date("2024-06-28"),
      teachingMemory: {
        learningVelocity: "fast",
        commonMistakes: [
          { type: "off-by-one", timestamp: new Date("2024-06-25"), problemId: "binary-search" },
          { type: "edge-case", timestamp: new Date("2024-06-27"), problemId: "two-sum" }
        ]
      }
    }
  },
  {
    email: "bob@example.com",
    displayName: "Bob Martinez",
    bio: "Self-taught developer transitioning from web development to systems programming.",
    role: "student",
    preferences: { language: "javascript", theme: "Socratica Light", fontSize: "16px" },
    learningProfile: {
      skillLevel: "intermediate",
      preferredStyle: "example",
      weakTopics: ["recursion", "dynamic-programming", "backtracking"],
      strongTopics: ["arrays", "hashmaps"],
      totalProblemsSolved: 18,
      totalSubmissions: 52,
      streakDays: 5,
      lastPracticeDate: new Date("2024-06-26"),
      teachingMemory: {
        learningVelocity: "moderate",
        commonMistakes: [
          { type: "recursion-base-case", timestamp: new Date("2024-06-20"), problemId: "fibonacci" },
          { type: "stack-overflow", timestamp: new Date("2024-06-24"), problemId: "reverse-linked-list" }
        ]
      }
    }
  },
  {
    email: "carol@example.com",
    displayName: "Carol Kim",
    bio: "Freshman learning CS fundamentals. Loves solving puzzles and brain teasers.",
    role: "student",
    preferences: { language: "python", theme: "Socratica Dark", fontSize: "14px" },
    learningProfile: {
      skillLevel: "beginner",
      preferredStyle: "analogy",
      weakTopics: ["linked-lists", "stacks", "queues", "trees", "graphs"],
      strongTopics: ["strings"],
      totalProblemsSolved: 8,
      totalSubmissions: 35,
      streakDays: 3,
      lastPracticeDate: new Date("2024-06-25"),
      teachingMemory: {
        learningVelocity: "slow",
        commonMistakes: [
          { type: "null-pointer", timestamp: new Date("2024-06-22"), problemId: "reverse-linked-list" },
          { type: "infinite-loop", timestamp: new Date("2024-06-24"), problemId: "valid-parentheses" }
        ]
      }
    }
  },
  {
    email: "dave@example.com",
    displayName: "Dave Thompson",
    bio: "Master's student in AI/ML. Preparing for technical interviews at FAANG companies.",
    role: "student",
    preferences: { language: "cpp", theme: "Socratica Dark", fontSize: "13px" },
    learningProfile: {
      skillLevel: "advanced",
      preferredStyle: "direct",
      weakTopics: ["system-design"],
      strongTopics: ["dynamic-programming", "graph-algorithms", "trees", "binary-search", "sorting"],
      totalProblemsSolved: 72,
      totalSubmissions: 180,
      streakDays: 21,
      lastPracticeDate: new Date("2024-06-28"),
      teachingMemory: {
        learningVelocity: "fast",
        commonMistakes: []
      }
    }
  },
  {
    email: "eve@example.com",
    displayName: "Eve Johnson",
    bio: "High school senior preparing for college. First exposure to computer science.",
    role: "student",
    preferences: { language: "javascript", theme: "Socratica Light", fontSize: "15px" },
    learningProfile: {
      skillLevel: "beginner",
      preferredStyle: "analogy",
      weakTopics: ["algorithms", "data-structures", "recursion"],
      strongTopics: [],
      totalProblemsSolved: 3,
      totalSubmissions: 15,
      streakDays: 1,
      lastPracticeDate: new Date("2024-06-20"),
      teachingMemory: {
        learningVelocity: "slow",
        commonMistakes: [
          { type: "syntax-error", timestamp: new Date("2024-06-18"), problemId: "reverse-string" },
          { type: "logic-error", timestamp: new Date("2024-06-19"), problemId: "two-sum" }
        ]
      }
    }
  }
];

async function seedAdditionalStudents() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = process.env.SEED_USER_PASSWORD || "SocraticaSeed123!";
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    let created = 0;
    for (const student of additionalStudents) {
      const existing = await User.findOne({ email: student.email });
      if (!existing) {
        await User.create({
          email: student.email,
          passwordHash,
          displayName: student.displayName,
          bio: student.bio,
          role: student.role,
          preferences: student.preferences,
          learningProfile: student.learningProfile,
          emailVerified: true
        });
        console.log(`Created student: ${student.email} (${student.displayName})`);
        created++;
      } else {
        console.log(`Student already exists: ${student.email}`);
      }
    }

    console.log(`\nDone — ${created} new students created`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdditionalStudents();