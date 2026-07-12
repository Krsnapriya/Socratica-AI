/**
 * Seed script — Socratica AI
 * Seeds: 12 Problems (with starterCode per language) + Oracle solutions (3 langs each)
 * Usage: node scripts/seed-oracles.js
 * Env:   MONGO_URI (default: mongodb://localhost:27017/socratica)
 */

const mongoose = require("mongoose");
const crypto   = require("crypto");
const { SUPPORTED_LANGUAGES } = require("../shared/language-configs");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

// ── Schemas (must match gateway) ──────────────────────────────────────────────
const oracleSchema = new mongoose.Schema({
  problemId: { type: String, index: true },
  language:  { type: String, enum: SUPPORTED_LANGUAGES, index: true },
  code:      String,
  codeHash:  String,
  updatedAt: { type: Date, default: Date.now },
});
oracleSchema.index({ problemId: 1, language: 1 }, { unique: true });
const Oracle = mongoose.model("Oracle", oracleSchema);

const problemSchema = new mongoose.Schema({
  problemId:   { type: String, unique: true, index: true },
  title:       String,
  description: String,
  difficulty:  String,
  category:    String,
  tags:        [String],
  starterCode: {
    python:     String,
    javascript: String,
    cpp:        String,
  },
  testCases:   [Object],
});
const Problem = mongoose.model("Problem", problemSchema);

// ── Problem catalog ───────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    problemId: "two-sum",
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    difficulty: "Easy",
    category: "Arrays & Hashing",
    tags: ["array", "hash-table"],
    starterCode: {
      python:     "def two_sum(nums, target):\n    # Your code here\n    pass\n",
      javascript: "function twoSum(nums, target) {\n  // Your code here\n}\n",
      cpp:        "#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n    return {};\n}\n",
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
    description: "The Fibonacci sequence is defined as F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2). Given n, calculate F(n). Use an iterative approach for O(n) time.",
    difficulty: "Easy",
    category: "Math & Dynamic Programming",
    tags: ["math", "dynamic-programming", "recursion"],
    starterCode: {
      python:     "def fib(n):\n    # Your code here\n    pass\n",
      javascript: "function fib(n) {\n  // Your code here\n}\n",
      cpp:        "int fib(int n) {\n    // Your code here\n    return 0;\n}\n",
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
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
    difficulty: "Easy",
    category: "Two Pointers",
    tags: ["two-pointers", "string"],
    starterCode: {
      python:     "def is_palindrome(s):\n    # Your code here\n    pass\n",
      javascript: "function isPalindrome(s) {\n  // Your code here\n}\n",
      cpp:        "#include <string>\nusing namespace std;\nbool isPalindrome(string s) {\n    // Your code here\n    return false;\n}\n",
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
    description: "Write a function that reverses a string and returns the reversed string.",
    difficulty: "Easy",
    category: "Two Pointers",
    tags: ["two-pointers", "string"],
    starterCode: {
      python:     "def reverse_string(s):\n    # Your code here\n    pass\n",
      javascript: "function reverseString(s) {\n  // Your code here\n}\n",
      cpp:        "#include <string>\nusing namespace std;\nstring reverseString(string s) {\n    // Your code here\n    return s;\n}\n",
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
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum. Use Kadane's algorithm for O(n) time.",
    difficulty: "Medium",
    category: "Dynamic Programming",
    tags: ["array", "dynamic-programming", "divide-and-conquer"],
    starterCode: {
      python:     "def max_subarray(nums):\n    # Your code here\n    pass\n",
      javascript: "function maxSubarray(nums) {\n  // Your code here\n}\n",
      cpp:        "#include <vector>\nusing namespace std;\nint maxSubarray(vector<int>& nums) {\n    // Your code here\n    return 0;\n}\n",
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
    description: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
    difficulty: "Easy",
    category: "Arrays & Hashing",
    tags: ["array", "hash-table", "sorting"],
    starterCode: {
      python:     "def contains_duplicate(nums):\n    # Your code here\n    pass\n",
      javascript: "function containsDuplicate(nums) {\n  // Your code here\n}\n",
      cpp:        "#include <vector>\nusing namespace std;\nbool containsDuplicate(vector<int>& nums) {\n    // Your code here\n    return false;\n}\n",
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
    description: "Implement bubble sort to sort an array of integers in ascending order. Optimize with an early-exit flag when no swaps occur in a pass.",
    difficulty: "Easy",
    category: "Sorting",
    tags: ["sorting", "array"],
    starterCode: {
      python:     "def bubble_sort(arr):\n    # Your code here\n    pass\n",
      javascript: "function bubbleSort(arr) {\n  // Your code here\n  return arr;\n}\n",
      cpp:        "#include <vector>\nusing namespace std;\nvector<int> bubbleSort(vector<int> arr) {\n    // Your code here\n    return arr;\n}\n",
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
    description: "Given a sorted array of integers `nums` and a target value, return the index of `target` if it exists in the array, otherwise return `-1`. Your solution must run in O(log n) time.",
    difficulty: "Easy",
    category: "Binary Search",
    tags: ["array", "binary-search"],
    starterCode: {
      python:     "def binary_search(nums, target):\n    # Your code here\n    pass\n",
      javascript: "function binarySearch(nums, target) {\n  // Your code here\n}\n",
      cpp:        "#include <vector>\nusing namespace std;\nint binarySearch(vector<int>& nums, int target) {\n    // Your code here\n    return -1;\n}\n",
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
    description: "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets, and open brackets are closed in the correct order.",
    difficulty: "Easy",
    category: "Stacks",
    tags: ["string", "stack"],
    starterCode: {
      python:     "def is_valid(s):\n    # Your code here\n    pass\n",
      javascript: "function isValid(s) {\n  // Your code here\n}\n",
      cpp:        "#include <string>\nusing namespace std;\nbool isValid(string s) {\n    // Your code here\n    return false;\n}\n",
    },
    testCases: [
      { input: ["()"], expected: true },
      { input: ["()[]{}"], expected: true },
      { input: ["(]"], expected: false }
    ],
  },
  {
    problemId: "merge-two-sorted-lists",
    title: "Merge Two Sorted Lists",
    description: "You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.",
    difficulty: "Easy",
    category: "Linked Lists",
    tags: ["linked-list", "recursion"],
    starterCode: {
      python:     "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef merge_two_lists(list1, list2):\n    # Your code here\n    pass\n",
      javascript: "class ListNode {\n  constructor(val = 0, next = null) {\n    this.val = val;\n    this.next = next;\n  }\n}\nfunction mergeTwoLists(list1, list2) {\n  // Your code here\n}\n",
      cpp:        "struct ListNode {\n    int val;\n    ListNode *next;\n    ListNode() : val(0), next(nullptr) {}\n    ListNode(int x) : val(x), next(nullptr) {}\n    ListNode(int x, ListNode *next) : val(x), next(next) {}\n};\nListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n    // Your code here\n    return nullptr;\n}\n",
    },
    testCases: [
      { input: [[1,2,4], [1,3,4]], expected: [1,1,2,3,4,4] },
      { input: [[], []], expected: [] },
      { input: [[], [0]], expected: [0] }
    ],
  },
  {
    problemId: "linked-list-cycle",
    title: "Linked List Cycle",
    description: "Given `head`, the head of a linked list, determine if the linked list has a cycle in it. There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the `next` pointer. Return `true` if there is a cycle in the linked list. Otherwise, return `false`.",
    difficulty: "Easy",
    category: "Linked Lists",
    tags: ["linked-list", "two-pointers", "hash-table"],
    starterCode: {
      python:     "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef has_cycle(head):\n    # Your code here\n    pass\n",
      javascript: "class ListNode {\n  constructor(val = 0, next = null) {\n    this.val = val;\n    this.next = next;\n  }\n}\nfunction hasCycle(head) {\n  // Your code here\n}\n",
      cpp:        "struct ListNode {\n    int val;\n    ListNode *next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};\nbool hasCycle(ListNode *head) {\n    // Your code here\n    return false;\n}\n",
    },
    testCases: [
      { input: [[3,2,0,-4], 1], expected: true },
      { input: [[1,2], 0], expected: true },
      { input: [[1], -1], expected: false }
    ],
  },
  {
    problemId: "valid-anagram",
    title: "Valid Anagram",
    description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    difficulty: "Easy",
    category: "Arrays & Hashing",
    tags: ["hash-table", "string", "sorting"],
    starterCode: {
      python:     "def is_anagram(s, t):\n    # Your code here\n    pass\n",
      javascript: "function isAnagram(s, t) {\n  // Your code here\n}\n",
      cpp:        "#include <string>\n#include <unordered_map>\nusing namespace std;\nbool isAnagram(string s, string t) {\n    // Your code here\n    return false;\n}\n",
    },
    testCases: [
      { input: ["anagram", "nagaram"], expected: true },
      { input: ["rat", "car"], expected: false },
      { input: ["", ""], expected: true }
    ],
  },
  {
    problemId: "group-anagrams",
    title: "Group Anagrams",
    description: "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order. An Anagram is a word formed by rearranging the letters of another, using all the original letters exactly once.",
    difficulty: "Medium",
    category: "Arrays & Hashing",
    tags: ["array", "hash-table", "string", "sorting"],
    starterCode: {
      python:     "def group_anagrams(strs):\n    # Your code here\n    pass\n",
      javascript: "function groupAnagrams(strs) {\n  // Your code here\n}\n",
      cpp:        "#include <vector>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\nvector<vector<string>> groupAnagrams(vector<string>& strs) {\n    // Your code here\n    return {};\n}\n",
    },
    testCases: [
      { input: [["eat","tea","tan","ate","nat","bat"]], expected: [["bat"],["nat","tan"],["ate","eat","tea"]] },
      { input: [[""]], expected: [[""]] },
      { input: [["a"]], expected: [["a"]] }
    ],
  },
  {
    problemId: "climbing-stairs",
    title: "Climbing Stairs",
    description: "You are climbing a staircase. It takes n steps to reach the top, and each time you can climb 1 or 2 steps. Return the number of distinct ways to climb to the top.",
    difficulty: "Easy",
    category: "Dynamic Programming",
    tags: ["dynamic-programming", "math"],
    starterCode: {
      python:     "def climb_stairs(n):\n    # Your code here\n    pass\n",
      javascript: "function climbStairs(n) {\n  // Your code here\n}\n",
      cpp:        "int climbStairs(int n) {\n    // Your code here\n    return 0;\n}\n",
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
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Return the maximum profit you can achieve from a single buy and single sell.",
    difficulty: "Easy",
    category: "Arrays & Hashing",
    tags: ["array", "greedy", "dynamic-programming"],
    starterCode: {
      python:     "def max_profit(prices):\n    # Your code here\n    pass\n",
      javascript: "function maxProfit(prices) {\n  // Your code here\n}\n",
      cpp:        "#include <vector>\nusing namespace std;\nint maxProfit(vector<int>& prices) {\n    // Your code here\n    return 0;\n}\n",
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
    description: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
    difficulty: "Easy",
    category: "Strings",
    tags: ["string", "array", "trie"],
    starterCode: {
      python:     "def longest_common_prefix(strs):\n    # Your code here\n    pass\n",
      javascript: "function longestCommonPrefix(strs) {\n  // Your code here\n}\n",
      cpp:        "#include <vector>\n#include <string>\nusing namespace std;\nstring longestCommonPrefix(vector<string>& strs) {\n    // Your code here\n    return \"\";\n}\n",
    },
    testCases: [
      { input: [["flower", "flow", "flight"]], expected: "fl" },
      { input: [["dog", "racecar", "car"]], expected: "" },
      { input: [["interspecies", "interstellar", "interstate"]], expected: "inters" }
    ],
  },
];

// ── Oracle solutions ──────────────────────────────────────────────────────────
const ORACLES = [
  // ── two-sum ──────────────────────────────────────────────────────────────
  { problemId: "two-sum", language: "python",
    code: `def two_sum(nums, target):
  seen = {}
  for i, n in enumerate(nums):
    if target - n in seen:
      return [seen[target - n], i]
    seen[n] = i
  return []
print(two_sum([2,7,11,15], 9))
print(two_sum([3,2,4], 6))
print(two_sum([3,3], 6))` },
  { problemId: "two-sum", language: "javascript",
    code: `function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (complement in seen) return [seen[complement], i];
    seen[nums[i]] = i;
  }
  return [];
}
console.log(twoSum([2,7,11,15],9).join(','));
console.log(twoSum([3,2,4],6).join(','));
console.log(twoSum([3,3],6).join(','));` },
  { problemId: "two-sum", language: "cpp",
    code: `#include <vector>
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
}
int main() {
  vector<int> a={2,7,11,15}; auto r=twoSum(a,9);
  cout<<r[0]<<","<<r[1]<<endl;
  vector<int> b={3,2,4}; r=twoSum(b,6);
  cout<<r[0]<<","<<r[1]<<endl;
  vector<int> c={3,3}; r=twoSum(c,6);
  cout<<r[0]<<","<<r[1]<<endl;
}` },

  // ── fibonacci ─────────────────────────────────────────────────────────────
  { problemId: "fibonacci", language: "python",
    code: `def fib(n):
  if n <= 1: return n
  a, b = 0, 1
  for _ in range(2, n + 1):
    a, b = b, a + b
  return b
print(fib(0))
print(fib(1))
print(fib(10))` },
  { problemId: "fibonacci", language: "javascript",
    code: `function fib(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; }
  return b;
}
console.log(fib(0));
console.log(fib(1));
console.log(fib(10));` },
  { problemId: "fibonacci", language: "cpp",
    code: `#include <iostream>
using namespace std;
int fib(int n) {
  if (n <= 1) return n;
  int a = 0, b = 1;
  for (int i = 2; i <= n; ++i) { int t = a + b; a = b; b = t; }
  return b;
}
int main() {
  cout<<fib(0)<<endl<<fib(1)<<endl<<fib(10)<<endl;
}` },

  // ── palindrome ────────────────────────────────────────────────────────────
  { problemId: "palindrome", language: "python",
    code: `def is_palindrome(s):
  s = ''.join(c.lower() for c in s if c.isalnum())
  return s == s[::-1]
print(is_palindrome("A man, a plan, a canal: Panama"))
print(is_palindrome("race a car"))
print(is_palindrome(" "))` },
  { problemId: "palindrome", language: "javascript",
    code: `function isPalindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}
console.log(isPalindrome("A man, a plan, a canal: Panama"));
console.log(isPalindrome("race a car"));
console.log(isPalindrome(" "));` },
  { problemId: "palindrome", language: "cpp",
    code: `#include <string>
#include <cctype>
#include <algorithm>
#include <iostream>
using namespace std;
bool isPalindrome(string s) {
  string t;
  for (char c : s) if (isalnum(c)) t += tolower(c);
  string r = t; reverse(r.begin(), r.end());
  return t == r;
}
int main() {
  cout<<isPalindrome("A man, a plan, a canal: Panama")<<endl;
  cout<<isPalindrome("race a car")<<endl;
  cout<<isPalindrome(" ")<<endl;
}` },

  // ── reverse-string ────────────────────────────────────────────────────────
  { problemId: "reverse-string", language: "python",
    code: `def reverse_string(s):
  return s[::-1]
print(reverse_string("hello"))
print(reverse_string("Hannah"))
print(reverse_string(""))` },
  { problemId: "reverse-string", language: "javascript",
    code: `function reverseString(s) {
  return s.split('').reverse().join('');
}
console.log(reverseString("hello"));
console.log(reverseString("Hannah"));
console.log(reverseString(""));` },
  { problemId: "reverse-string", language: "cpp",
    code: `#include <string>
#include <algorithm>
#include <iostream>
using namespace std;
string reverseString(string s) {
  reverse(s.begin(), s.end()); return s;
}
int main() {
  cout<<reverseString("hello")<<endl;
  cout<<reverseString("Hannah")<<endl;
  cout<<reverseString("")<<endl;
}` },

  // ── max-subarray ──────────────────────────────────────────────────────────
  { problemId: "max-subarray", language: "python",
    code: `def max_subarray(nums):
  max_sum = curr = nums[0]
  for n in nums[1:]:
    curr = max(n, curr + n)
    max_sum = max(max_sum, curr)
  return max_sum
print(max_subarray([-2,1,-3,4,-1,2,1,-5,4]))
print(max_subarray([1]))
print(max_subarray([5,4,-1,7,8]))` },
  { problemId: "max-subarray", language: "javascript",
    code: `function maxSubarray(nums) {
  let maxSum = nums[0], curr = nums[0];
  for (let i = 1; i < nums.length; i++) {
    curr = Math.max(nums[i], curr + nums[i]);
    maxSum = Math.max(maxSum, curr);
  }
  return maxSum;
}
console.log(maxSubarray([-2,1,-3,4,-1,2,1,-5,4]));
console.log(maxSubarray([1]));
console.log(maxSubarray([5,4,-1,7,8]));` },
  { problemId: "max-subarray", language: "cpp",
    code: `#include <vector>
#include <algorithm>
#include <iostream>
using namespace std;
int maxSubarray(vector<int>& nums) {
  int maxSum = nums[0], curr = nums[0];
  for (int i = 1; i < (int)nums.size(); ++i) {
    curr = max(nums[i], curr + nums[i]);
    maxSum = max(maxSum, curr);
  }
  return maxSum;
}
int main() {
  vector<int> a={-2,1,-3,4,-1,2,1,-5,4}; cout<<maxSubarray(a)<<endl;
  vector<int> b={1}; cout<<maxSubarray(b)<<endl;
  vector<int> c={5,4,-1,7,8}; cout<<maxSubarray(c)<<endl;
}` },

  // ── contains-duplicate ────────────────────────────────────────────────────
  { problemId: "contains-duplicate", language: "python",
    code: `def contains_duplicate(nums):
  seen = set()
  for n in nums:
    if n in seen: return True
    seen.add(n)
  return False
print(contains_duplicate([1,2,3,1]))
print(contains_duplicate([1,2,3,4]))
print(contains_duplicate([1,1,1,3,3,4,3,2,4,2]))` },
  { problemId: "contains-duplicate", language: "javascript",
    code: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}
console.log(containsDuplicate([1,2,3,1]));
console.log(containsDuplicate([1,2,3,4]));
console.log(containsDuplicate([1,1,1,3,3,4,3,2,4,2]));` },
  { problemId: "contains-duplicate", language: "cpp",
    code: `#include <vector>
#include <unordered_set>
#include <iostream>
using namespace std;
bool containsDuplicate(vector<int>& nums) {
  unordered_set<int> seen;
  for (int n : nums) {
    if (seen.count(n)) return true;
    seen.insert(n);
  }
  return false;
}
int main() {
  vector<int> a={1,2,3,1}; cout<<containsDuplicate(a)<<endl;
  vector<int> b={1,2,3,4}; cout<<containsDuplicate(b)<<endl;
  vector<int> c={1,1,1,3,3,4,3,2,4,2}; cout<<containsDuplicate(c)<<endl;
}` },

  // ── bubble-sort ───────────────────────────────────────────────────────────
  { problemId: "bubble-sort", language: "python",
    code: `def bubble_sort(arr):
  n = len(arr)
  for i in range(n):
    swapped = False
    for j in range(0, n - i - 1):
      if arr[j] > arr[j + 1]:
        arr[j], arr[j + 1] = arr[j + 1], arr[j]
        swapped = True
    if not swapped: break
  return arr
print(bubble_sort([64,34,25,12,22,11,90]))
print(bubble_sort([5,1,4,2,8]))
print(bubble_sort([1]))` },
  { problemId: "bubble-sort", language: "javascript",
    code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) { [arr[j], arr[j+1]] = [arr[j+1], arr[j]]; swapped = true; }
    }
    if (!swapped) break;
  }
  return arr;
}
console.log(bubbleSort([64,34,25,12,22,11,90]).join(','));
console.log(bubbleSort([5,1,4,2,8]).join(','));
console.log(bubbleSort([1]).join(','));` },
  { problemId: "bubble-sort", language: "cpp",
    code: `#include <vector>
#include <algorithm>
#include <iostream>
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
}
int main() {
  for (auto& v : bubbleSort({64,34,25,12,22,11,90})) cout<<v<<" "; cout<<endl;
  for (auto& v : bubbleSort({5,1,4,2,8})) cout<<v<<" "; cout<<endl;
  for (auto& v : bubbleSort({1})) cout<<v<<" "; cout<<endl;
}` },

  // ── binary-search ─────────────────────────────────────────────────────────
  { problemId: "binary-search", language: "python",
    code: `def binary_search(nums, target):
  lo, hi = 0, len(nums) - 1
  while lo <= hi:
    mid = (lo + hi) // 2
    if nums[mid] == target: return mid
    if nums[mid] < target: lo = mid + 1
    else: hi = mid - 1
  return -1
print(binary_search([-1,0,3,5,9,12], 9))
print(binary_search([-1,0,3,5,9,12], 2))
print(binary_search([5], 5))` },
  { problemId: "binary-search", language: "javascript",
    code: `function binarySearch(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
console.log(binarySearch([-1,0,3,5,9,12], 9));
console.log(binarySearch([-1,0,3,5,9,12], 2));
console.log(binarySearch([5], 5));` },
  { problemId: "binary-search", language: "cpp",
    code: `#include <vector>
#include <iostream>
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
}
int main() {
  vector<int> a={-1,0,3,5,9,12};
  cout<<binarySearch(a,9)<<endl<<binarySearch(a,2)<<endl;
  vector<int> b={5}; cout<<binarySearch(b,5)<<endl;
}` },

  // ── valid-parentheses ─────────────────────────────────────────────────────
  { problemId: "valid-parentheses", language: "python",
    code: `def is_valid(s):
  pairs = {')': '(', ']': '[', '}': '{'}
  stack = []
  for c in s:
    if c in pairs:
      if not stack or stack[-1] != pairs[c]: return False
      stack.pop()
    else:
      stack.append(c)
  return not stack
print(is_valid("()"))
print(is_valid("()[]{}"))
print(is_valid("(]"))` },
  { problemId: "valid-parentheses", language: "javascript",
    code: `function isValid(s) {
  const pairs = {')': '(', ']': '[', '}': '{'};
  const stack = [];
  for (const c of s) {
    if (c in pairs) {
      if (!stack.length || stack[stack.length-1] !== pairs[c]) return false;
      stack.pop();
    } else { stack.push(c); }
  }
  return !stack.length;
}
console.log(isValid("()"));
console.log(isValid("()[]{}"));
console.log(isValid("(]"));` },
  { problemId: "valid-parentheses", language: "cpp",
    code: `#include <string>
#include <stack>
#include <unordered_map>
#include <iostream>
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
}
int main() {
  cout<<isValid("()")<<endl<<isValid("()[]{}")<<endl<<isValid("(]")<<endl;
}` },

  // ── climbing-stairs ──────────────────────────────────────────────────────
  { problemId: "climbing-stairs", language: "python",
    code: `def climb_stairs(n):
  if n <= 2:
    return n
  prev2, prev1 = 1, 2
  for _ in range(3, n + 1):
    prev2, prev1 = prev1, prev1 + prev2
  return prev1
print(climb_stairs(2))
print(climb_stairs(3))
print(climb_stairs(5))` },
  { problemId: "climbing-stairs", language: "javascript",
    code: `function climbStairs(n) {
  if (n <= 2) return n;
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    [prev2, prev1] = [prev1, prev1 + prev2];
  }
  return prev1;
}
console.log(climbStairs(2));
console.log(climbStairs(3));
console.log(climbStairs(5));` },
  { problemId: "climbing-stairs", language: "cpp",
    code: `#include <iostream>
using namespace std;
int climbStairs(int n) {
  if (n <= 2) return n;
  int prev2 = 1, prev1 = 2;
  for (int i = 3; i <= n; ++i) {
    int next = prev1 + prev2;
    prev2 = prev1;
    prev1 = next;
  }
  return prev1;
}
int main() {
  cout<<climbStairs(2)<<endl;
  cout<<climbStairs(3)<<endl;
  cout<<climbStairs(5)<<endl;
}` },

  // ── best-time-to-buy-and-sell-stock ──────────────────────────────────────
  { problemId: "best-time-to-buy-and-sell-stock", language: "python",
    code: `def max_profit(prices):
  min_price = prices[0]
  best = 0
  for price in prices[1:]:
    best = max(best, price - min_price)
    min_price = min(min_price, price)
  return best
print(max_profit([7,1,5,3,6,4]))
print(max_profit([7,6,4,3,1]))
print(max_profit([1,2]))` },
  { problemId: "best-time-to-buy-and-sell-stock", language: "javascript",
    code: `function maxProfit(prices) {
  let minPrice = prices[0];
  let best = 0;
  for (let i = 1; i < prices.length; i++) {
    best = Math.max(best, prices[i] - minPrice);
    minPrice = Math.min(minPrice, prices[i]);
  }
  return best;
}
console.log(maxProfit([7,1,5,3,6,4]));
console.log(maxProfit([7,6,4,3,1]));
console.log(maxProfit([1,2]));` },
  { problemId: "best-time-to-buy-and-sell-stock", language: "cpp",
    code: `#include <vector>
#include <algorithm>
#include <iostream>
using namespace std;
int maxProfit(vector<int>& prices) {
  int minPrice = prices[0], best = 0;
  for (size_t i = 1; i < prices.size(); ++i) {
    best = max(best, prices[i] - minPrice);
    minPrice = min(minPrice, prices[i]);
  }
  return best;
}
int main() {
  vector<int> a={7,1,5,3,6,4}; cout<<maxProfit(a)<<endl;
  vector<int> b={7,6,4,3,1}; cout<<maxProfit(b)<<endl;
  vector<int> c={1,2}; cout<<maxProfit(c)<<endl;
}` },

  // ── longest-common-prefix ─────────────────────────────────────────────────
  { problemId: "longest-common-prefix", language: "python",
    code: `def longest_common_prefix(strs):
  if not strs:
    return ""
  prefix = strs[0]
  for s in strs[1:]:
    while not s.startswith(prefix):
      prefix = prefix[:-1]
      if not prefix:
        return ""
  return prefix
print(longest_common_prefix(["flower", "flow", "flight"]))
print(longest_common_prefix(["dog", "racecar", "car"]))
print(longest_common_prefix(["interspecies", "interstellar", "interstate"]))` },
  { problemId: "longest-common-prefix", language: "javascript",
    code: `function longestCommonPrefix(strs) {
  if (!strs.length) return '';
  let prefix = strs[0];
  for (const str of strs.slice(1)) {
    while (!str.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  return prefix;
}
console.log(longestCommonPrefix(["flower", "flow", "flight"]));
console.log(longestCommonPrefix(["dog", "racecar", "car"]));
console.log(longestCommonPrefix(["interspecies", "interstellar", "interstate"]));` },
  { problemId: "longest-common-prefix", language: "cpp",
    code: `#include <vector>
#include <string>
#include <iostream>
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
}
int main() {
  vector<string> a={"flower","flow","flight"}; cout<<longestCommonPrefix(a)<<endl;
  vector<string> b={"dog","racecar","car"}; cout<<longestCommonPrefix(b)<<endl;
  vector<string> c={"interspecies","interstellar","interstate"}; cout<<longestCommonPrefix(c)<<endl;
}` },
];

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB\n");

  console.log("── Seeding Problems ─────────────────────────────────────────");
  for (const prob of PROBLEMS) {
    await Problem.findOneAndUpdate(
      { problemId: prob.problemId },
      prob,
      { upsert: true, new: true }
    );
    console.log(`  ✓ ${prob.problemId}  [${prob.difficulty}]`);
  }

  console.log("\n── Seeding Oracles ──────────────────────────────────────────");
  for (const oracle of ORACLES) {
    const codeHash = crypto.createHash("sha256").update(oracle.code).digest("hex");
    await Oracle.findOneAndUpdate(
      { problemId: oracle.problemId, language: oracle.language },
      { ...oracle, codeHash },
      { upsert: true }
    );
    console.log(`  ✓ ${oracle.language.padEnd(12)} ${oracle.problemId}`);
  }

  console.log(`\n✓ Done — ${PROBLEMS.length} problems, ${ORACLES.length} oracle solutions`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("✗ Seed failed:", err.message);
  process.exit(1);
});
