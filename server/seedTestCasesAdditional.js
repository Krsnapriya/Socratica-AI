require("dotenv").config();
const mongoose = require("mongoose");
const TestCase = require("./models/TestCase");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

// Additional hidden test cases for JavaScript and C++
const additionalTestCases = [
  // two-sum - JavaScript hidden
  {
    problemId: "two-sum",
    language: "javascript",
    visibility: "hidden",
    category: "edge",
    input: "[-3,4,3,90], target=0",
    expectedOutput: "0 2",
    description: "Negative numbers with zero sum"
  },
  {
    problemId: "two-sum",
    language: "javascript",
    visibility: "hidden",
    category: "boundary",
    input: "[0,4,3,0], target=0",
    expectedOutput: "0 3",
    description: "Multiple zeros"
  },
  // two-sum - C++ hidden
  {
    problemId: "two-sum",
    language: "cpp",
    visibility: "hidden",
    category: "edge",
    input: "[-10,7,19,15], target=5",
    expectedOutput: "0 2",
    description: "Large negative numbers"
  },
  // fibonacci - JavaScript hidden
  {
    problemId: "fibonacci",
    language: "javascript",
    visibility: "hidden",
    category: "stress",
    input: "n=40",
    expectedOutput: "102334155",
    description: "Large fibonacci number"
  },
  // fibonacci - C++ hidden
  {
    problemId: "fibonacci",
    language: "cpp",
    visibility: "hidden",
    category: "stress",
    input: "n=45",
    expectedOutput: "1134903170",
    description: "Very large fibonacci number"
  },
  // valid-parentheses - JavaScript hidden
  {
    problemId: "valid-parentheses",
    language: "javascript",
    visibility: "hidden",
    category: "edge",
    input: "((()))",
    expectedOutput: "true",
    description: "Nested parentheses"
  },
  {
    problemId: "valid-parentheses",
    language: "javascript",
    visibility: "hidden",
    category: "boundary",
    input: "(()",
    expectedOutput: "false",
    description: "Unbalanced opening"
  },
  // valid-parentheses - C++ hidden
  {
    problemId: "valid-parentheses",
    language: "cpp",
    visibility: "hidden",
    category: "edge",
    input: "{[()]}",
    expectedOutput: "true",
    description: "Mixed brackets"
  },
  // binary-search - JavaScript hidden
  {
    problemId: "binary-search",
    language: "javascript",
    visibility: "hidden",
    category: "edge",
    input: "[5], target=5",
    expectedOutput: "0",
    description: "Single element found"
  },
  {
    problemId: "binary-search",
    language: "javascript",
    visibility: "hidden",
    category: "boundary",
    input: "[1,3,5,7,9], target=10",
    expectedOutput: "-1",
    description: "Target not in array"
  },
  // binary-search - C++ hidden
  {
    problemId: "binary-search",
    language: "cpp",
    visibility: "hidden",
    category: "edge",
    input: "[-5,-3,0,2,4], target=-3",
    expectedOutput: "1",
    description: "Negative numbers"
  },
  // reverse-linked-list - JavaScript hidden
  {
    problemId: "reverse-linked-list",
    language: "javascript",
    visibility: "hidden",
    category: "boundary",
    input: "[1]",
    expectedOutput: "1",
    description: "Single node"
  },
  // reverse-linked-list - C++ hidden
  {
    problemId: "reverse-linked-list",
    language: "cpp",
    visibility: "hidden",
    category: "boundary",
    input: "[1,2]",
    expectedOutput: "2 1",
    description: "Two nodes"
  },
  // valid-palindrome - JavaScript hidden
  {
    problemId: "valid-palindrome",
    language: "javascript",
    visibility: "hidden",
    category: "edge",
    input: "A man, a plan, a canal: Panama",
    expectedOutput: "true",
    description: "Classic palindrome with punctuation"
  },
  // valid-palindrome - C++ hidden
  {
    problemId: "valid-palindrome",
    language: "cpp",
    visibility: "hidden",
    category: "edge",
    input: "race a car",
    expectedOutput: "false",
    description: "Non-palindrome with spaces"
  },
  // reverse-string - JavaScript hidden
  {
    problemId: "reverse-string",
    language: "javascript",
    visibility: "hidden",
    category: "edge",
    input: "abcdefg",
    expectedOutput: "gfedcba",
    description: "Full alphabet reverse"
  },
  // reverse-string - C++ hidden
  {
    problemId: "reverse-string",
    language: "cpp",
    visibility: "hidden",
    category: "edge",
    input: "Hello, World!",
    expectedOutput: "!dlroW ,olleH",
    description: "With punctuation and spaces"
  },
  // max-subarray - JavaScript hidden
  {
    problemId: "max-subarray",
    language: "javascript",
    visibility: "hidden",
    category: "edge",
    input: "[-2,1,-3,4,-1,2,1,-5,4]",
    expectedOutput: "6",
    description: "Mixed positive and negative"
  },
  // max-subarray - C++ hidden
  {
    problemId: "max-subarray",
    language: "cpp",
    visibility: "hidden",
    category: "edge",
    input: "[1]",
    expectedOutput: "1",
    description: "Single element"
  },
  // contains-duplicate - JavaScript hidden
  {
    problemId: "contains-duplicate",
    language: "javascript",
    visibility: "hidden",
    category: "edge",
    input: "[1,2,3,4,5]",
    expectedOutput: "false",
    description: "No duplicates"
  },
  // contains-duplicate - C++ hidden
  {
    problemId: "contains-duplicate",
    language: "cpp",
    visibility: "hidden",
    category: "edge",
    input: "[1,1,1,1,1]",
    expectedOutput: "true",
    description: "All duplicates"
  },
  // bubble-sort - JavaScript hidden
  {
    problemId: "bubble-sort",
    language: "javascript",
    visibility: "hidden",
    category: "edge",
    input: "[5,4,3,2,1]",
    expectedOutput: "1 2 3 4 5",
    description: "Reverse sorted"
  },
  // bubble-sort - C++ hidden
  {
    problemId: "bubble-sort",
    language: "cpp",
    visibility: "hidden",
    category: "edge",
    input: "[1,2,3,4,5]",
    expectedOutput: "1 2 3 4 5",
    description: "Already sorted"
  },
  // climbing-stairs - JavaScript hidden
  {
    problemId: "climbing-stairs",
    language: "javascript",
    visibility: "hidden",
    category: "stress",
    input: "n=20",
    expectedOutput: "10946",
    description: "Large number of stairs"
  },
  // climbing-stairs - C++ hidden
  {
    problemId: "climbing-stairs",
    language: "cpp",
    visibility: "hidden",
    category: "stress",
    input: "n=30",
    expectedOutput: "1346269",
    description: "Very large number of stairs"
  },
  // best-time-to-buy - JavaScript hidden
  {
    problemId: "best-time-to-buy-and-sell-stock",
    language: "javascript",
    visibility: "hidden",
    category: "edge",
    input: "[7,6,4,3,1]",
    expectedOutput: "0",
    description: "Decreasing prices"
  },
  // best-time-to-buy - C++ hidden
  {
    problemId: "best-time-to-buy-and-sell-stock",
    language: "cpp",
    visibility: "hidden",
    category: "edge",
    input: "[2,4,1]",
    expectedOutput: "2",
    description: "Quick rise and fall"
  },
  // longest-common-prefix - JavaScript hidden
  {
    problemId: "longest-common-prefix",
    language: "javascript",
    visibility: "hidden",
    category: "edge",
    input: '["dog","racecar","car"]',
    expectedOutput: " ",
    description: "No common prefix"
  },
  // longest-common-prefix - C++ hidden
  {
    problemId: "longest-common-prefix",
    language: "cpp",
    visibility: "hidden",
    category: "edge",
    input: '["flower","flow","flight"]',
    expectedOutput: "fl",
    description: "Partial match"
  }
];

async function seedAdditionalTestCases() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    let created = 0;
    for (const tc of additionalTestCases) {
      const existing = await TestCase.findOne({
        problemId: tc.problemId,
        language: tc.language,
        input: tc.input,
        visibility: tc.visibility
      });
      
      if (!existing) {
        await TestCase.create(tc);
        created++;
      }
    }

    console.log(`Created ${created} additional test cases`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdditionalTestCases();