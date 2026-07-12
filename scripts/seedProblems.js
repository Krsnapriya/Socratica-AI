/**
 * Seed script — Socratica AI
 * Seeds: Problems with embedded Oracle solutions according to Spec Section 5.
 * Usage: node scripts/seedProblems.js
 */

const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

// Import Schema
const Problem = require("../server/models/Problem");

// Pre-existing Problems from seed-oracles.js
const PROBLEMS = [
  {
    problemId: "two-sum",
    title: "Two Sum",
    statement: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    difficulty: "Easy",
    starterCode: {
      python: "def two_sum(nums, target):\n    # Your code here\n    pass\n",
      javascript: "function twoSum(nums, target) {\n  // Your code here\n}\n",
      cpp: "#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n    return {};\n}\n",
    },
    testCases: [
      { input: [[2,7,11,15], 9], expected: [0,1] },
      { input: [[3,2,4], 6], expected: [1,2] },
      { input: [[3,3], 6], expected: [0,1] }
    ],
  },
  {
    problemId: "fibonacci",
    title: "Fibonacci Number",
    statement: "The Fibonacci sequence is defined as F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2). Given n, calculate F(n). Use an iterative approach for O(n) time.",
    difficulty: "Easy",
    starterCode: {
      python: "def fib(n):\n    # Your code here\n    pass\n",
      javascript: "function fib(n) {\n  // Your code here\n}\n",
      cpp: "int fib(int n) {\n    // Your code here\n    return 0;\n}\n",
    },
    testCases: [
      { input: [0], expected: 0 },
      { input: [1], expected: 1 },
      { input: [10], expected: 55 }
    ],
  },
  {
    problemId: "palindrome",
    title: "Valid Palindrome",
    statement: "A phrase is a palindrome if, after converting all uppercase letters into lowercase and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
    difficulty: "Easy",
    starterCode: {
      python: "def is_palindrome(s):\n    # Your code here\n    pass\n",
      javascript: "function isPalindrome(s) {\n  // Your code here\n}\n",
      cpp: "#include <string>\nusing namespace std;\nbool isPalindrome(string s) {\n    // Your code here\n    return false;\n}\n",
    },
    testCases: [
      { input: ["A man, a plan, a canal: Panama"], expected: true },
      { input: ["race a car"], expected: false },
      { input: [" "], expected: true }
    ],
  },
  {
    problemId: "reverse-string",
    title: "Reverse String",
    statement: "Write a function that reverses a string and returns the reversed string.",
    difficulty: "Easy",
    starterCode: {
      python: "def reverse_string(s):\n    # Your code here\n    pass\n",
      javascript: "function reverseString(s) {\n  // Your code here\n}\n",
      cpp: "#include <string>\nusing namespace std;\nstring reverseString(string s) {\n    // Your code here\n    return s;\n}\n",
    },
    testCases: [
      { input: ["hello"], expected: "olleh" },
      { input: ["Hannah"], expected: "hannaH" },
      { input: [""], expected: "" }
    ],
  },
  {
    problemId: "max-subarray",
    title: "Maximum Subarray",
    statement: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum. Use Kadane's algorithm for O(n) time.",
    difficulty: "Medium",
    starterCode: {
      python: "def max_subarray(nums):\n    # Your code here\n    pass\n",
      javascript: "function maxSubarray(nums) {\n  // Your code here\n}\n",
      cpp: "#include <vector>\nusing namespace std;\nint maxSubarray(vector<int>& nums) {\n    // Your code here\n    return 0;\n}\n",
    },
    testCases: [
      { input: [[-2,1,-3,4,-1,2,1,-5,4]], expected: 6 },
      { input: [[1]], expected: 1 },
      { input: [[5,4,-1,7,8]], expected: 23 }
    ],
  },
  {
    problemId: "contains-duplicate",
    title: "Contains Duplicate",
    statement: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
    difficulty: "Easy",
    starterCode: {
      python: "def contains_duplicate(nums):\n    # Your code here\n    pass\n",
      javascript: "function containsDuplicate(nums) {\n  // Your code here\n}\n",
      cpp: "#include <vector>\nusing namespace std;\nbool containsDuplicate(vector<int>& nums) {\n    // Your code here\n    return false;\n}\n",
    },
    testCases: [
      { input: [[1,2,3,1]], expected: true },
      { input: [[1,2,3,4]], expected: false },
      { input: [[1,1,1,3,3,4,3,2,4,2]], expected: true }
    ],
  },
  {
    problemId: "bubble-sort",
    title: "Bubble Sort",
    statement: "Implement bubble sort to sort an array of integers in ascending order. Optimize with an early-exit flag when no swaps occur in a pass.",
    difficulty: "Easy",
    starterCode: {
      python: "def bubble_sort(arr):\n    # Your code here\n    pass\n",
      javascript: "function bubbleSort(arr) {\n  // Your code here\n  return arr;\n}\n",
      cpp: "#include <vector>\nusing namespace std;\nvector<int> bubbleSort(vector<int> arr) {\n    // Your code here\n    return arr;\n}\n",
    },
    testCases: [
      { input: [[64,34,25,12,22,11,90]], expected: [11,12,22,25,34,64,90] },
      { input: [[5,1,4,2,8]], expected: [1,2,4,5,8] },
      { input: [[1]], expected: [1] }
    ],
  },
  {
    problemId: "binary-search",
    title: "Binary Search",
    statement: "Given a sorted array of integers `nums` and a target value, return the index of `target` if it exists in the array, otherwise return `-1`. Your solution must run in O(log n) time.",
    difficulty: "Easy",
    starterCode: {
      python: "def binary_search(nums, target):\n    # Your code here\n    pass\n",
      javascript: "function binarySearch(nums, target) {\n  // Your code here\n}\n",
      cpp: "#include <vector>\nusing namespace std;\nint binarySearch(vector<int>& nums, int target) {\n    // Your code here\n    return -1;\n}\n",
    },
    testCases: [
      { input: [[-1,0,3,5,9,12], 9], expected: 4 },
      { input: [[-1,0,3,5,9,12], 2], expected: -1 },
      { input: [[5], 5], expected: 0 }
    ],
  },
  {
    problemId: "valid-parentheses",
    title: "Valid Parentheses",
    statement: "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets, and open brackets are closed in the correct order.",
    difficulty: "Easy",
    starterCode: {
      python: "def is_valid(s):\n    # Your code here\n    pass\n",
      javascript: "function isValid(s) {\n  // Your code here\n}\n",
      cpp: "#include <string>\nusing namespace std;\nbool isValid(string s) {\n    // Your code here\n    return false;\n}\n",
    },
    testCases: [
      { input: ["()"], expected: true },
      { input: ["()[]{}"], expected: true },
      { input: ["(]"], expected: false }
    ],
  },
  {
    problemId: "climbing-stairs",
    title: "Climbing Stairs",
    statement: "You are climbing a staircase. It takes n steps to reach the top, and each time you can climb 1 or 2 steps. Return the number of distinct ways to climb to the top.",
    difficulty: "Easy",
    starterCode: {
      python: "def climb_stairs(n):\n    # Your code here\n    pass\n",
      javascript: "function climbStairs(n) {\n  // Your code here\n}\n",
      cpp: "int climbStairs(int n) {\n    // Your code here\n    return 0;\n}\n",
    },
    testCases: [
      { input: [2], expected: 2 },
      { input: [3], expected: 3 },
      { input: [5], expected: 8 }
    ],
  },
  {
    problemId: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    statement: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Return the maximum profit you can achieve from a single buy and single sell.",
    difficulty: "Easy",
    starterCode: {
      python: "def max_profit(prices):\n    # Your code here\n    pass\n",
      javascript: "function maxProfit(prices) {\n  // Your code here\n}\n",
      cpp: "#include <vector>\nusing namespace std;\nint maxProfit(vector<int>& prices) {\n    // Your code here\n    return 0;\n}\n",
    },
    testCases: [
      { input: [[7,1,5,3,6,4]], expected: 5 },
      { input: [[7,6,4,3,1]], expected: 0 },
      { input: [[1,2]], expected: 1 }
    ],
  },
  {
    problemId: "longest-common-prefix",
    title: "Longest Common Prefix",
    statement: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
    difficulty: "Easy",
    starterCode: {
      python: "def longest_common_prefix(strs):\n    # Your code here\n    pass\n",
      javascript: "function longestCommonPrefix(strs) {\n  // Your code here\n}\n",
      cpp: "#include <vector>\n#include <string>\nusing namespace std;\nstring longestCommonPrefix(vector<string>& strs) {\n    // Your code here\n    return \"\";\n}\n",
    },
    testCases: [
      { input: [["flower", "flow", "flight"]], expected: "fl" },
      { input: [["dog", "racecar", "car"]], expected: "" },
      { input: [["interspecies", "interstellar", "interstate"]], expected: "inters" }
    ],
  },
];

// Pre-existing Oracle Solutions
const ORACLES = {
  "two-sum": {
    python: `def two_sum(nums, target):
  seen = {}
  for i, n in enumerate(nums):
    if target - n in seen:
      return [seen[target - n], i]
    seen[n] = i
  return []`,
    javascript: `function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (complement in seen) return [seen[complement], i];
    seen[nums[i]] = i;
  }
  return [];
}`,
    cpp: `#include <vector>
#include <unordered_map>
#include <iostream>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
  unordered_map<int,int> seen;
  for (int i = 0; i < (int)nums.size(); ++i) {
    if (seen.count(target - nums[i]))
      return {seen[target - nums[i]], i};
    seen[nums[i]] = i;
  }
  return {};
}`
  },
  "fibonacci": {
    python: `def fib(n):
  if n <= 1: return n
  a, b = 0, 1
  for _ in range(2, n + 1):
    a, b = b, a + b
  return b`,
    javascript: `function fib(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; }
  return b;
}`,
    cpp: `int fib(int n) {
  if (n <= 1) return n;
  int a = 0, b = 1;
  for (int i = 2; i <= n; ++i) { int t = a + b; a = b; b = t; }
  return b;
}`
  },
  "palindrome": {
    python: `def is_palindrome(s):
  s = ''.join(c.lower() for c in s if c.isalnum())
  return s == s[::-1]`,
    javascript: `function isPalindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}`,
    cpp: `#include <string>
#include <cctype>
#include <algorithm>
using namespace std;
bool isPalindrome(string s) {
  string t;
  for (char c : s) if (isalnum(c)) t += tolower(c);
  string r = t; reverse(r.begin(), r.end());
  return t == r;
}`
  },
  "reverse-string": {
    python: `def reverse_string(s):
  return s[::-1]`,
    javascript: `function reverseString(s) {
  return s.split('').reverse().join('');
}`,
    cpp: `#include <string>
#include <algorithm>
using namespace std;
string reverseString(string s) {
  reverse(s.begin(), s.end()); return s;
}`
  },
  "max-subarray": {
    python: `def max_subarray(nums):
  max_sum = curr = nums[0]
  for n in nums[1:]:
    curr = max(n, curr + n)
    max_sum = max(max_sum, curr)
  return max_sum`,
    javascript: `function maxSubarray(nums) {
  let maxSum = nums[0], curr = nums[0];
  for (let i = 1; i < nums.length; i++) {
    curr = Math.max(nums[i], curr + nums[i]);
    maxSum = Math.max(maxSum, curr);
  }
  return maxSum;
}`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
int maxSubarray(vector<int>& nums) {
  int maxSum = nums[0], curr = nums[0];
  for (int i = 1; i < (int)nums.size(); ++i) {
    curr = max(nums[i], curr + nums[i]);
    maxSum = max(maxSum, curr);
  }
  return maxSum;
}`
  },
  "contains-duplicate": {
    python: `def contains_duplicate(nums):
  seen = set()
  for n in nums:
    if n in seen: return True
    seen.add(n)
  return False`,
    javascript: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}`,
    cpp: `#include <vector>
#include <unordered_set>
using namespace std;
bool containsDuplicate(vector<int>& nums) {
  unordered_set<int> seen;
  for (int n : nums) {
    if (seen.count(n)) return true;
    seen.insert(n);
  }
  return false;
}`
  },
  "bubble-sort": {
    python: `def bubble_sort(arr):
  n = len(arr)
  for i in range(n):
    swapped = False
    for j in range(0, n - i - 1):
      if arr[j] > arr[j + 1]:
        arr[j], arr[j + 1] = arr[j + 1], arr[j]
        swapped = True
    if not swapped: break
  return arr`,
    javascript: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) { [arr[j], arr[j+1]] = [arr[j+1], arr[j]]; swapped = true; }
    }
    if (!swapped) break;
  }
  return arr;
}`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
vector<int> bubbleSort(vector<int> arr) {
  int n = arr.size();
  for (int i = 0; i < n; ++i) {
    bool swapped = false;
    for (int j = 0; j < n-i-1; ++j)
      if (arr[j] > arr[j+1]) { swap(arr[j], arr[j+1]); swapped = true; }
    if (!swapped) break;
  }
  return arr;
}`
  },
  "binary-search": {
    python: `def binary_search(nums, target):
  lo, hi = 0, len(nums) - 1
  while lo <= hi:
    mid = (lo + hi) // 2
    if nums[mid] == target: return mid
    if nums[mid] < target: lo = mid + 1
    else: hi = mid - 1
  return -1`,
    javascript: `function binarySearch(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
    cpp: `#include <vector>
using namespace std;
int binarySearch(vector<int>& nums, int target) {
  int lo = 0, hi = nums.size() - 1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (nums[mid] == target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`
  },
  "valid-parentheses": {
    python: `def is_valid(s):
  pairs = {')': '(', ']': '[', '}': '{'}
  stack = []
  for c in s:
    if c in pairs:
      if not stack or stack[-1] != pairs[c]: return False
      stack.pop()
    else:
      stack.append(c)
  return not stack`,
    javascript: `function isValid(s) {
  const pairs = {')': '(', ']': '[', '}': '{'};
  const stack = [];
  for (const c of s) {
    if (c in pairs) {
      if (!stack.length || stack[stack.length-1] !== pairs[c]) return false;
      stack.pop();
    } else { stack.push(c); }
  }
  return !stack.length;
}`,
    cpp: `#include <string>
#include <stack>
#include <unordered_map>
using namespace std;
bool isValid(string s) {
  unordered_map<char,char> pairs{{')','('},{']','['},{'}','{'}};
  stack<char> st;
  for (char c : s) {
    if (pairs.count(c)) {
      if (st.empty() || st.top() != pairs[c]) return false;
      st.pop();
    } else { st.push(c); }
  }
  return st.empty();
}`
  },
  "climbing-stairs": {
    python: `def climb_stairs(n):
  if n <= 2:
    return n
  prev2, prev1 = 1, 2
  for _ in range(3, n + 1):
    prev2, prev1 = prev1, prev1 + prev2
  return prev1`,
    javascript: `function climbStairs(n) {
  if (n <= 2) return n;
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    [prev2, prev1] = [prev1, prev1 + prev2];
  }
  return prev1;
}`,
    cpp: `int climbStairs(int n) {
  if (n <= 2) return n;
  int prev2 = 1, prev1 = 2;
  for (int i = 3; i <= n; ++i) {
    int next = prev1 + prev2;
    prev2 = prev1;
    prev1 = next;
  }
  return prev1;
}`
  },
  "best-time-to-buy-and-sell-stock": {
    python: `def max_profit(prices):
  min_price = prices[0]
  best = 0
  for price in prices[1:]:
    best = max(best, price - min_price)
    min_price = min(min_price, price)
  return best`,
    javascript: `function maxProfit(prices) {
  let minPrice = prices[0];
  let best = 0;
  for (let i = 1; i < prices.length; i++) {
    best = Math.max(best, prices[i] - minPrice);
    minPrice = Math.min(minPrice, prices[i]);
  }
  return best;
}`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
int maxProfit(vector<int>& prices) {
  int minPrice = prices[0], best = 0;
  for (size_t i = 1; i < prices.size(); ++i) {
    best = max(best, prices[i] - minPrice);
    minPrice = min(minPrice, prices[i]);
  }
  return best;
}`
  },
  "longest-common-prefix": {
    python: `def longest_common_prefix(strs):
  if not strs:
    return ""
  prefix = strs[0]
  for s in strs[1:]:
    while not s.startswith(prefix):
      prefix = prefix[:-1]
      if not prefix:
        return ""
  return prefix`,
    javascript: `function longestCommonPrefix(strs) {
  if (!strs.length) return '';
  let prefix = strs[0];
  for (const str of strs.slice(1)) {
    while (!str.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  return prefix;
}`,
    cpp: `#include <vector>
#include <string>
using namespace std;
string longestCommonPrefix(vector<string>& strs) {
  if (strs.empty()) return "";
  string prefix = strs[0];
  for (const auto& str : strs) {
    while (str.find(prefix) != 0) {
      prefix.pop_back();
      if (prefix.empty()) return "";
    }
  }
  return prefix;
}`
  }
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB");

  for (const prob of PROBLEMS) {
    const embeddedOracles = ORACLES[prob.problemId] || {};
    const data = {
      ...prob,
      oracleSolutions: {
        python: embeddedOracles.python || "",
        cpp: embeddedOracles.cpp || "",
        javascript: embeddedOracles.javascript || ""
      },
      oracleVerified: {
        python: false,
        cpp: false,
        javascript: false
      }
    };

    await Problem.findOneAndUpdate(
      { problemId: prob.problemId },
      data,
      { upsert: true, new: true }
    );
    console.log(`  ✓ Seeded: ${prob.problemId}`);
  }

  console.log(`✓ Seeded ${PROBLEMS.length} problems with embedded solutions.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error("✗ Seeding failed:", err.message);
    process.exit(1);
  });
} else {
  module.exports = seed;
}
