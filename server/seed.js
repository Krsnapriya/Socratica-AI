/**
 * Socratica AI — Database Seeder
 * Run: node seed.js
 * Seeds 5 real algorithm problems with starter code and oracle solutions.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Problem = require("./models/Problem");
const Course = require("./models/Course");
const Module = require("./models/Module");
const seedPermissions = require("./seedPermissions");
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

const problems = [
  // ── 1. Two Sum ──────────────────────────────────────────────────────────────
  {
    problemId: "two-sum",
    title: "Two Sum",
    category: "Arrays",
    difficulty: "easy",
    tags: ["array", "hash-map"],
    estimatedMinutes: 15,
    statement: `Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.

Example:
Input: nums = [2,7,11,15], target = 9
Output: 0 1

Input: nums = [3,2,4], target = 6
Output: 1 2`,
    starterCode: {
      python: `def two_sum(nums, target):
    # Your solution here
    pass

import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
target = int(data[n+1])
result = two_sum(nums, target)
print(result[0], result[1])`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const nums = parts.slice(1, n + 1);
  const target = parts[n + 1];

  function twoSum(nums, target) {
    // Your solution here
  }

  const result = twoSum(nums, target);
  console.log(result[0], result[1]);
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
    // Your solution here
    return {};
}
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    int target; cin >> target;
    auto res = twoSum(nums, target);
    cout << res[0] << " " << res[1] << endl;
}`,
    },
    oracleSolutions: {
      python: `def two_sum(nums, target):
    seen = {}
    for i, v in enumerate(nums):
        comp = target - v
        if comp in seen:
            return [seen[comp], i]
        seen[v] = i
    return []

import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
target = int(data[n+1])
result = two_sum(nums, target)
print(result[0], result[1])`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const nums = parts.slice(1, n + 1);
  const target = parts[n + 1];
  const seen = new Map();
  let result;
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (seen.has(comp)) { result = [seen.get(comp), i]; break; }
    seen.set(nums[i], i);
  }
  console.log(result[0], result[1]);
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    int target; cin >> target;
    unordered_map<int,int> seen;
    for (int i = 0; i < n; i++) {
        int comp = target - nums[i];
        if (seen.count(comp)) { cout << seen[comp] << " " << i << endl; return 0; }
        seen[nums[i]] = i;
    }
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "4 2 7 11 15 9", expectedOutput: "0 1" },
      { input: "3 3 2 4 6", expectedOutput: "1 2" },
      { input: "2 3 3 6", expectedOutput: "0 1" },
    ],
  },

  // ── 2. Reverse Linked List ──────────────────────────────────────────────────
  {
    problemId: "reverse-linked-list",
    title: "Reverse Linked List",
    category: "Linked Lists",
    difficulty: "easy",
    tags: ["linked-list", "recursion"],
    estimatedMinutes: 20,
    statement: `Given the head of a singly linked list, reverse the list, and return the reversed list.

The list is provided as space-separated integers. Output the reversed list as space-separated integers.

Constraints:
- 0 <= Number of nodes <= 5000
- -5000 <= Node.val <= 5000

Example:
Input: 1 2 3 4 5
Output: 5 4 3 2 1

Input: 1 2
Output: 2 1`,
    starterCode: {
      python: `import sys

def reverse_list(values):
    # Your solution here
    pass

data = sys.stdin.read().split()
values = list(map(int, data))
result = reverse_list(values)
print(*result)`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const values = lines.join(' ').trim().split(' ').filter(Boolean).map(Number);

  function reverseList(values) {
    // Your solution here
  }

  console.log(reverseList(values).join(' '));
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    vector<int> v;
    int x;
    while (cin >> x) v.push_back(x);
    // Your solution here: reverse v
    for (int i = 0; i < v.size(); i++) {
        cout << v[i];
        if (i + 1 < v.size()) cout << " ";
    }
    cout << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
data = sys.stdin.read().split()
values = list(map(int, data))
values.reverse()
print(*values)`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const values = lines.join(' ').trim().split(' ').filter(Boolean).map(Number);
  console.log(values.reverse().join(' '));
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    vector<int> v;
    int x;
    while (cin >> x) v.push_back(x);
    reverse(v.begin(), v.end());
    for (int i = 0; i < (int)v.size(); i++) {
        cout << v[i];
        if (i + 1 < (int)v.size()) cout << " ";
    }
    cout << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "1 2 3 4 5", expectedOutput: "5 4 3 2 1" },
      { input: "1 2", expectedOutput: "2 1" },
    ],
  },

  // ── 3. Valid Parentheses ────────────────────────────────────────────────────
  {
    problemId: "valid-parentheses",
    title: "Valid Parentheses",
    category: "Stacks",
    difficulty: "easy",
    tags: ["stack", "string"],
    estimatedMinutes: 20,
    statement: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Output "true" or "false".

Example:
Input: ()
Output: true

Input: ()[]{} 
Output: true

Input: (]
Output: false`,
    starterCode: {
      python: `import sys

def is_valid(s):
    # Your solution here
    pass

s = sys.stdin.read().strip()
print("true" if is_valid(s) else "false")`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const s = lines[0];

  function isValid(s) {
    // Your solution here
  }

  console.log(isValid(s) ? 'true' : 'false');
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
bool isValid(string s) {
    // Your solution here
    return false;
}
int main() {
    string s; cin >> s;
    cout << (isValid(s) ? "true" : "false") << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
def is_valid(s):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for c in s:
        if c in '({[':
            stack.append(c)
        elif not stack or stack[-1] != pairs[c]:
            return False
        else:
            stack.pop()
    return len(stack) == 0
s = sys.stdin.read().strip()
print("true" if is_valid(s) else "false")`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const s = lines[0];
  const stack = [];
  const pairs = {')': '(', '}': '{', ']': '['};
  let valid = true;
  for (const c of s) {
    if ('({['.includes(c)) stack.push(c);
    else if (!stack.length || stack[stack.length-1] !== pairs[c]) { valid = false; break; }
    else stack.pop();
  }
  if (stack.length) valid = false;
  console.log(valid ? 'true' : 'false');
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    stack<char> st;
    map<char,char> pairs = {{')',  '('}, {'}', '{'}, {']', '['}};
    bool valid = true;
    for (char c : s) {
        if (c=='('||c=='{'||c=='[') st.push(c);
        else if (st.empty() || st.top() != pairs[c]) { valid=false; break; }
        else st.pop();
    }
    if (!st.empty()) valid = false;
    cout << (valid ? "true" : "false") << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "()", expectedOutput: "true" },
      { input: "()[]{}", expectedOutput: "true" },
      { input: "(]", expectedOutput: "false" },
      { input: "([)]", expectedOutput: "false" },
    ],
  },

  // ── 4. Binary Search ────────────────────────────────────────────────────────
  {
    problemId: "binary-search",
    title: "Binary Search",
    category: "Algorithms",
    difficulty: "easy",
    tags: ["binary-search", "array"],
    estimatedMinutes: 15,
    statement: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

Input format: first line has n (array length), second has array elements, third has target.

Example:
Input: 6 -1 0 3 5 9 12 9
Output: 4

Input: 3 1 2 3 4
Output: -1`,
    starterCode: {
      python: `import sys

def binary_search(nums, target):
    # Your solution here
    pass

data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
target = int(data[n+1])
print(binary_search(nums, target))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const nums = parts.slice(1, n + 1);
  const target = parts[n + 1];

  function binarySearch(nums, target) {
    // Your solution here
  }

  console.log(binarySearch(nums, target));
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int binarySearch(vector<int>& nums, int target) {
    // Your solution here
    return -1;
}
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    int target; cin >> target;
    cout << binarySearch(nums, target) << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        elif nums[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
target = int(data[n+1])
print(binary_search(nums, target))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const nums = parts.slice(1, n + 1);
  const target = parts[n + 1];
  let lo = 0, hi = nums.length - 1, result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) { result = mid; break; }
    else if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  console.log(result);
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    int target; cin >> target;
    int lo=0, hi=n-1, res=-1;
    while(lo<=hi){ int m=(lo+hi)/2; if(nums[m]==target){res=m;break;} else if(nums[m]<target) lo=m+1; else hi=m-1; }
    cout << res << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "6 -1 0 3 5 9 12 9", expectedOutput: "4" },
      { input: "3 1 2 3 4", expectedOutput: "-1" },
    ],
  },

  // ── 5. Fibonacci (Memoized) ──────────────────────────────────────────────────
  {
    problemId: "fibonacci",
    title: "Fibonacci Number",
    category: "Recursion",
    difficulty: "medium",
    tags: ["recursion", "memoization", "dynamic-programming"],
    estimatedMinutes: 25,
    statement: `The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. That is:
F(0) = 0, F(1) = 1
F(n) = F(n - 1) + F(n - 2), for n > 1.

Given n, calculate F(n). Your solution should be efficient for large n values.

Constraints:
- 0 <= n <= 30

Example:
Input: 2
Output: 1

Input: 10
Output: 55`,
    starterCode: {
      python: `import sys

def fib(n):
    # Your solution here
    pass

n = int(sys.stdin.read().strip())
print(fib(n))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
  const n = parseInt(line.trim());

  function fib(n) {
    // Your solution here
  }

  console.log(fib(n));
  rl.close();
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int fib(int n) {
    // Your solution here
    return 0;
}
int main() {
    int n; cin >> n;
    cout << fib(n) << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)

n = int(sys.stdin.read().strip())
print(fib(n))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
  const n = parseInt(line.trim());
  const memo = {};
  function fib(n) {
    if (n <= 1) return n;
    if (memo[n] !== undefined) return memo[n];
    return (memo[n] = fib(n-1) + fib(n-2));
  }
  console.log(fib(n));
  rl.close();
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
map<int,long long> memo;
long long fib(int n) {
    if (n <= 1) return n;
    if (memo.count(n)) return memo[n];
    return memo[n] = fib(n-1) + fib(n-2);
}
int main() {
    int n; cin >> n;
    cout << fib(n) << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "2", expectedOutput: "1" },
      { input: "3", expectedOutput: "2" },
      { input: "10", expectedOutput: "55" },
      { input: "0", expectedOutput: "0" },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("[seed] Connected to MongoDB");

    let created = 0;
    let skipped = 0;

    for (const p of problems) {
      // Ensure description mirrors statement
      if (!p.description) p.description = p.statement;

      const existing = await Problem.findOne({ problemId: p.problemId });
      if (existing) {
        // Update in-place so we get new fields without dropping existing
        await Problem.findOneAndUpdate({ problemId: p.problemId }, p, { new: true });
        console.log(`[seed] Updated: ${p.title}`);
        skipped++;
      } else {
        await Problem.create(p);
        console.log(`[seed] Created: ${p.title}`);
        created++;
      }
    }

    console.log(`[seed] Problems done — ${created} created, ${skipped} updated`);

    // ── Seed Curriculum Structure ──────────────────────────────────────────────
    console.log("[seed] Seeding curriculum...");
    
    // Check if course exists
    let course = await Course.findOne({ title: "Core Computer Science" });
    if (!course) {
      course = await Course.create({
        title: "Core Computer Science",
        description: "Master the fundamental algorithms and data structures required for technical interviews and systems engineering.",
        icon: "school",
        order: 1
      });
      console.log(`[seed] Created Course: ${course.title}`);
    }

    // Module 1: Data Structures
    let dsModule = await Module.findOne({ title: "Data Structures & Arrays" });
    if (!dsModule) {
      dsModule = await Module.create({
        course: course._id,
        title: "Data Structures & Arrays",
        description: "Foundational techniques for arrays, linked lists, and basic data organization.",
        order: 1,
        topics: [
          { title: "Two Sum", problemId: "two-sum" },
          { title: "Reverse Linked List", problemId: "reverse-linked-list" },
          { title: "Valid Parentheses", problemId: "valid-parentheses" }
        ]
      });
      console.log(`[seed] Created Module: ${dsModule.title}`);
    }

    // Module 2: Algorithms
    let algoModule = await Module.findOne({ title: "Algorithms & Logic" });
    if (!algoModule) {
      algoModule = await Module.create({
        course: course._id,
        title: "Algorithms & Logic",
        description: "Intermediate algorithmic thinking, search techniques, and dynamic programming.",
        order: 2,
        topics: [
          { title: "Binary Search", problemId: "binary-search" },
          { title: "Fibonacci Memoization", problemId: "fibonacci" }
        ],
        prerequisites: [dsModule._id]
      });
      console.log(`[seed] Created Module: ${algoModule.title}`);
    }

    // Link modules to course
    if (!course.modules || course.modules.length === 0) {
      course.modules = [dsModule._id, algoModule._id];
      await course.save();
    }

    // ── Seed Permissions ───────────────────────────────────────────────────────
    console.log("[seed] Seeding permissions...");
    await seedPermissions();

    console.log(`\n[seed] Done — ${created} created, ${skipped} updated`);
  } catch (err) {
    console.error("[seed] Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("[seed] Disconnected");
    process.exit(0);
  }
}

seed();
