const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

const User = require("../server/models/User");
const Problem = require("../server/models/Problem");
const Course = require("../server/models/Course");
const Module = require("../server/models/Module");

const PROBLEMS = [
  {
    problemId: "two-sum", title: "Two Sum",
    statement: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    difficulty: "Easy", category: "Arrays & Hashing", tags: ["array", "hash-table"],
    starterCode: { python: "def two_sum(nums, target):\n    # Your code here\n    pass\n", javascript: "function twoSum(nums, target) {\n  // Your code here\n}\n", cpp: "#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n    return {};\n}\n" },
    oracleSolutions: { python: `def two_sum(nums, target):\n  seen = {}\n  for i, n in enumerate(nums):\n    if target - n in seen:\n      return [seen[target - n], i]\n    seen[n] = i\n  return []`, javascript: `function twoSum(nums, target) {\n  const seen = {};\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (complement in seen) return [seen[complement], i];\n    seen[nums[i]] = i;\n  }\n  return [];\n}`, cpp: `#include <vector>\n#include <unordered_map>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n  unordered_map<int,int> seen;\n  for (int i = 0; i < (int)nums.size(); ++i) {\n    if (seen.count(target - nums[i]))\n      return {seen[target - nums[i]], i};\n    seen[nums[i]] = i;\n  }\n  return {};\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: [[2,7,11,15], 9], expected: [0,1] }, { input: [[3,2,4], 6], expected: [1,2] }, { input: [[3,3], 6], expected: [0,1] }],
  },
  {
    problemId: "fibonacci", title: "Fibonacci Number",
    statement: "The Fibonacci sequence is defined as F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2). Given n, calculate F(n). Use an iterative approach for O(n) time.",
    difficulty: "Easy", category: "Math & DP", tags: ["math", "dynamic-programming"],
    starterCode: { python: "def fib(n):\n    # Your code here\n    pass\n", javascript: "function fib(n) {\n  // Your code here\n}\n", cpp: "int fib(int n) {\n    // Your code here\n    return 0;\n}\n" },
    oracleSolutions: { python: `def fib(n):\n  if n <= 1: return n\n  a, b = 0, 1\n  for _ in range(2, n + 1):\n    a, b = b, a + b\n  return b`, javascript: `function fib(n) {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; }\n  return b;\n}`, cpp: `int fib(int n) {\n  if (n <= 1) return n;\n  int a = 0, b = 1;\n  for (int i = 2; i <= n; ++i) { int t = a + b; a = b; b = t; }\n  return b;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: [0], expected: 0 }, { input: [1], expected: 1 }, { input: [10], expected: 55 }],
  },
  {
    problemId: "palindrome", title: "Valid Palindrome",
    statement: "A phrase is a palindrome if, after converting all uppercase letters into lowercase and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
    difficulty: "Easy", category: "Two Pointers", tags: ["two-pointers", "string"],
    starterCode: { python: "def is_palindrome(s):\n    # Your code here\n    pass\n", javascript: "function isPalindrome(s) {\n  // Your code here\n}\n", cpp: "#include <string>\nusing namespace std;\nbool isPalindrome(string s) {\n    // Your code here\n    return false;\n}\n" },
    oracleSolutions: { python: `def is_palindrome(s):\n  s = ''.join(c.lower() for c in s if c.isalnum())\n  return s == s[::-1]`, javascript: `function isPalindrome(s) {\n  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return cleaned === cleaned.split('').reverse().join('');\n}`, cpp: `#include <string>\n#include <cctype>\n#include <algorithm>\nusing namespace std;\nbool isPalindrome(string s) {\n  string t;\n  for (char c : s) if (isalnum(c)) t += tolower(c);\n  string r = t; reverse(r.begin(), r.end());\n  return t == r;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: ["A man, a plan, a canal: Panama"], expected: true }, { input: ["race a car"], expected: false }, { input: [" "], expected: true }],
  },
  {
    problemId: "reverse-string", title: "Reverse String",
    statement: "Write a function that reverses a string and returns the reversed string.",
    difficulty: "Easy", category: "Two Pointers", tags: ["two-pointers", "string"],
    starterCode: { python: "def reverse_string(s):\n    # Your code here\n    pass\n", javascript: "function reverseString(s) {\n  // Your code here\n}\n", cpp: "#include <string>\nusing namespace std;\nstring reverseString(string s) {\n    // Your code here\n    return s;\n}\n" },
    oracleSolutions: { python: `def reverse_string(s):\n  return s[::-1]`, javascript: `function reverseString(s) {\n  return s.split('').reverse().join('');\n}`, cpp: `#include <string>\n#include <algorithm>\nusing namespace std;\nstring reverseString(string s) {\n  reverse(s.begin(), s.end()); return s;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: ["hello"], expected: "olleh" }, { input: ["Hannah"], expected: "hannaH" }, { input: [""], expected: "" }],
  },
  {
    problemId: "max-subarray", title: "Maximum Subarray",
    statement: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum. Use Kadane's algorithm for O(n) time.",
    difficulty: "Medium", category: "Dynamic Programming", tags: ["array", "dynamic-programming"],
    starterCode: { python: "def max_subarray(nums):\n    # Your code here\n    pass\n", javascript: "function maxSubarray(nums) {\n  // Your code here\n}\n", cpp: "#include <vector>\nusing namespace std;\nint maxSubarray(vector<int>& nums) {\n    // Your code here\n    return 0;\n}\n" },
    oracleSolutions: { python: `def max_subarray(nums):\n  max_sum = curr = nums[0]\n  for n in nums[1:]:\n    curr = max(n, curr + n)\n    max_sum = max(max_sum, curr)\n  return max_sum`, javascript: `function maxSubarray(nums) {\n  let maxSum = nums[0], curr = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    curr = Math.max(nums[i], curr + nums[i]);\n    maxSum = Math.max(maxSum, curr);\n  }\n  return maxSum;\n}`, cpp: `#include <vector>\n#include <algorithm>\nusing namespace std;\nint maxSubarray(vector<int>& nums) {\n  int maxSum = nums[0], curr = nums[0];\n  for (int i = 1; i < (int)nums.size(); ++i) {\n    curr = max(nums[i], curr + nums[i]);\n    maxSum = max(maxSum, curr);\n  }\n  return maxSum;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: [[-2,1,-3,4,-1,2,1,-5,4]], expected: 6 }, { input: [[1]], expected: 1 }, { input: [[5,4,-1,7,8]], expected: 23 }],
  },
  {
    problemId: "contains-duplicate", title: "Contains Duplicate",
    statement: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
    difficulty: "Easy", category: "Arrays & Hashing", tags: ["array", "hash-table"],
    starterCode: { python: "def contains_duplicate(nums):\n    # Your code here\n    pass\n", javascript: "function containsDuplicate(nums) {\n  // Your code here\n}\n", cpp: "#include <vector>\nusing namespace std;\nbool containsDuplicate(vector<int>& nums) {\n    // Your code here\n    return false;\n}\n" },
    oracleSolutions: { python: `def contains_duplicate(nums):\n  seen = set()\n  for n in nums:\n    if n in seen: return True\n    seen.add(n)\n  return False`, javascript: `function containsDuplicate(nums) {\n  const seen = new Set();\n  for (const n of nums) {\n    if (seen.has(n)) return true;\n    seen.add(n);\n  }\n  return false;\n}`, cpp: `#include <vector>\n#include <unordered_set>\nusing namespace std;\nbool containsDuplicate(vector<int>& nums) {\n  unordered_set<int> seen;\n  for (int n : nums) {\n    if (seen.count(n)) return true;\n    seen.insert(n);\n  }\n  return false;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: [[1,2,3,1]], expected: true }, { input: [[1,2,3,4]], expected: false }, { input: [[1,1,1,3,3,4,3,2,4,2]], expected: true }],
  },
  {
    problemId: "bubble-sort", title: "Bubble Sort",
    statement: "Implement bubble sort to sort an array of integers in ascending order. Optimize with an early-exit flag when no swaps occur in a pass.",
    difficulty: "Easy", category: "Sorting", tags: ["sorting", "array"],
    starterCode: { python: "def bubble_sort(arr):\n    # Your code here\n    pass\n", javascript: "function bubbleSort(arr) {\n  // Your code here\n  return arr;\n}\n", cpp: "#include <vector>\nusing namespace std;\nvector<int> bubbleSort(vector<int> arr) {\n    // Your code here\n    return arr;\n}\n" },
    oracleSolutions: { python: `def bubble_sort(arr):\n  n = len(arr)\n  for i in range(n):\n    swapped = False\n    for j in range(0, n - i - 1):\n      if arr[j] > arr[j + 1]:\n        arr[j], arr[j + 1] = arr[j + 1], arr[j]\n        swapped = True\n    if not swapped: break\n  return arr`, javascript: `function bubbleSort(arr) {\n  const n = arr.length;\n  for (let i = 0; i < n; i++) {\n    let swapped = false;\n    for (let j = 0; j < n - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) { [arr[j], arr[j+1]] = [arr[j+1], arr[j]]; swapped = true; }\n    }\n    if (!swapped) break;\n  }\n  return arr;\n}`, cpp: `#include <vector>\n#include <algorithm>\nusing namespace std;\nvector<int> bubbleSort(vector<int> arr) {\n  int n = arr.size();\n  for (int i = 0; i < n; ++i) {\n    bool swapped = false;\n    for (int j = 0; j < n-i-1; ++j)\n      if (arr[j] > arr[j+1]) { swap(arr[j], arr[j+1]); swapped = true; }\n    if (!swapped) break;\n  }\n  return arr;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: [[64,34,25,12,22,11,90]], expected: [11,12,22,25,34,64,90] }, { input: [[5,1,4,2,8]], expected: [1,2,4,5,8] }, { input: [[1]], expected: [1] }],
  },
  {
    problemId: "binary-search", title: "Binary Search",
    statement: "Given a sorted array of integers `nums` and a target value, return the index of `target` if it exists in the array, otherwise return `-1`. Your solution must run in O(log n) time.",
    difficulty: "Easy", category: "Binary Search", tags: ["array", "binary-search"],
    starterCode: { python: "def binary_search(nums, target):\n    # Your code here\n    pass\n", javascript: "function binarySearch(nums, target) {\n  // Your code here\n}\n", cpp: "#include <vector>\nusing namespace std;\nint binarySearch(vector<int>& nums, int target) {\n    // Your code here\n    return -1;\n}\n" },
    oracleSolutions: { python: `def binary_search(nums, target):\n  lo, hi = 0, len(nums) - 1\n  while lo <= hi:\n    mid = (lo + hi) // 2\n    if nums[mid] == target: return mid\n    if nums[mid] < target: lo = mid + 1\n    else: hi = mid - 1\n  return -1`, javascript: `function binarySearch(nums, target) {\n  let lo = 0, hi = nums.length - 1;\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}`, cpp: `#include <vector>\nusing namespace std;\nint binarySearch(vector<int>& nums, int target) {\n  int lo = 0, hi = nums.size() - 1;\n  while (lo <= hi) {\n    int mid = lo + (hi - lo) / 2;\n    if (nums[mid] == target) return mid;\n    if (nums[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: [[-1,0,3,5,9,12], 9], expected: 4 }, { input: [[-1,0,3,5,9,12], 2], expected: -1 }, { input: [[5], 5], expected: 0 }],
  },
  {
    problemId: "valid-parentheses", title: "Valid Parentheses",
    statement: "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.",
    difficulty: "Easy", category: "Stacks", tags: ["string", "stack"],
    starterCode: { python: "def is_valid(s):\n    # Your code here\n    pass\n", javascript: "function isValid(s) {\n  // Your code here\n}\n", cpp: "#include <string>\nusing namespace std;\nbool isValid(string s) {\n    // Your code here\n    return false;\n}\n" },
    oracleSolutions: { python: `def is_valid(s):\n  pairs = {')': '(', ']': '[', '}': '{'}\n  stack = []\n  for c in s:\n    if c in pairs:\n      if not stack or stack[-1] != pairs[c]: return False\n      stack.pop()\n    else:\n      stack.append(c)\n  return not stack`, javascript: `function isValid(s) {\n  const pairs = {')': '(', ']': '[', '}': '{'};\n  const stack = [];\n  for (const c of s) {\n    if (c in pairs) {\n      if (!stack.length || stack[stack.length-1] !== pairs[c]) return false;\n      stack.pop();\n    } else { stack.push(c); }\n  }\n  return !stack.length;\n}`, cpp: `#include <string>\n#include <stack>\n#include <unordered_map>\nusing namespace std;\nbool isValid(string s) {\n  unordered_map<char,char> pairs{{')','('},{']','['},{'}','{'}};\n  stack<char> st;\n  for (char c : s) {\n    if (pairs.count(c)) {\n      if (st.empty() || st.top() != pairs[c]) return false;\n      st.pop();\n    } else { st.push(c); }\n  }\n  return st.empty();\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: ["()"], expected: true }, { input: ["()[]{}"], expected: true }, { input: ["(]"], expected: false }],
  },
  {
    problemId: "climbing-stairs", title: "Climbing Stairs",
    statement: "You are climbing a staircase. It takes n steps to reach the top, and each time you can climb 1 or 2 steps. Return the number of distinct ways to climb to the top.",
    difficulty: "Easy", category: "Dynamic Programming", tags: ["dynamic-programming", "math"],
    starterCode: { python: "def climb_stairs(n):\n    # Your code here\n    pass\n", javascript: "function climbStairs(n) {\n  // Your code here\n}\n", cpp: "int climbStairs(int n) {\n    // Your code here\n    return 0;\n}\n" },
    oracleSolutions: { python: `def climb_stairs(n):\n  if n <= 2:\n    return n\n  prev2, prev1 = 1, 2\n  for _ in range(3, n + 1):\n    prev2, prev1 = prev1, prev1 + prev2\n  return prev1`, javascript: `function climbStairs(n) {\n  if (n <= 2) return n;\n  let prev2 = 1, prev1 = 2;\n  for (let i = 3; i <= n; i++) {\n    [prev2, prev1] = [prev1, prev1 + prev2];\n  }\n  return prev1;\n}`, cpp: `int climbStairs(int n) {\n  if (n <= 2) return n;\n  int prev2 = 1, prev1 = 2;\n  for (int i = 3; i <= n; ++i) {\n    int next = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = next;\n  }\n  return prev1;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: [2], expected: 2 }, { input: [3], expected: 3 }, { input: [5], expected: 8 }],
  },
  {
    problemId: "best-time-to-buy-and-sell-stock", title: "Best Time to Buy and Sell Stock",
    statement: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Return the maximum profit you can achieve from a single buy and single sell.",
    difficulty: "Easy", category: "Arrays & Hashing", tags: ["array", "greedy"],
    starterCode: { python: "def max_profit(prices):\n    # Your code here\n    pass\n", javascript: "function maxProfit(prices) {\n  // Your code here\n}\n", cpp: "#include <vector>\nusing namespace std;\nint maxProfit(vector<int>& prices) {\n    // Your code here\n    return 0;\n}\n" },
    oracleSolutions: { python: `def max_profit(prices):\n  min_price = prices[0]\n  best = 0\n  for price in prices[1:]:\n    best = max(best, price - min_price)\n    min_price = min(min_price, price)\n  return best`, javascript: `function maxProfit(prices) {\n  let minPrice = prices[0];\n  let best = 0;\n  for (let i = 1; i < prices.length; i++) {\n    best = Math.max(best, prices[i] - minPrice);\n    minPrice = Math.min(minPrice, prices[i]);\n  }\n  return best;\n}`, cpp: `#include <vector>\n#include <algorithm>\nusing namespace std;\nint maxProfit(vector<int>& prices) {\n  int minPrice = prices[0], best = 0;\n  for (size_t i = 1; i < prices.size(); ++i) {\n    best = max(best, prices[i] - minPrice);\n    minPrice = min(minPrice, prices[i]);\n  }\n  return best;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: [[7,1,5,3,6,4]], expected: 5 }, { input: [[7,6,4,3,1]], expected: 0 }, { input: [[1,2]], expected: 1 }],
  },
  {
    problemId: "longest-common-prefix", title: "Longest Common Prefix",
    statement: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
    difficulty: "Easy", category: "Strings", tags: ["string", "array"],
    starterCode: { python: "def longest_common_prefix(strs):\n    # Your code here\n    pass\n", javascript: "function longestCommonPrefix(strs) {\n  // Your code here\n}\n", cpp: "#include <vector>\n#include <string>\nusing namespace std;\nstring longestCommonPrefix(vector<string>& strs) {\n    // Your code here\n    return \"\";\n}\n" },
    oracleSolutions: { python: `def longest_common_prefix(strs):\n  if not strs:\n    return ""\n  prefix = strs[0]\n  for s in strs[1:]:\n    while not s.startswith(prefix):\n      prefix = prefix[:-1]\n      if not prefix:\n        return ""\n  return prefix`, javascript: `function longestCommonPrefix(strs) {\n  if (!strs.length) return '';\n  let prefix = strs[0];\n  for (const str of strs.slice(1)) {\n    while (!str.startsWith(prefix)) {\n      prefix = prefix.slice(0, -1);\n      if (!prefix) return '';\n    }\n  }\n  return prefix;\n}`, cpp: `#include <vector>\n#include <string>\nusing namespace std;\nstring longestCommonPrefix(vector<string>& strs) {\n  if (strs.empty()) return "";\n  string prefix = strs[0];\n  for (const auto& str : strs) {\n    while (str.find(prefix) != 0) {\n      prefix.pop_back();\n      if (prefix.empty()) return "";\n    }\n  }\n  return prefix;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: [["flower", "flow", "flight"]], expected: "fl" }, { input: [["dog", "racecar", "car"]], expected: "" }, { input: [["interspecies", "interstellar", "interstate"]], expected: "inters" }],
  },
  {
    problemId: "merge-two-sorted-lists", title: "Merge Two Sorted Lists",
    statement: "You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.",
    difficulty: "Easy", category: "Linked Lists", tags: ["linked-list", "recursion"],
    starterCode: { python: "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef merge_two_lists(list1, list2):\n    # Your code here\n    pass\n", javascript: "class ListNode {\n  constructor(val = 0, next = null) {\n    this.val = val;\n    this.next = next;\n  }\n}\nfunction mergeTwoLists(list1, list2) {\n  // Your code here\n}\n", cpp: "struct ListNode {\n    int val;\n    ListNode *next;\n    ListNode() : val(0), next(nullptr) {}\n    ListNode(int x) : val(x), next(nullptr) {}\n    ListNode(int x, ListNode *next) : val(x), next(next) {}\n};\nListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n    // Your code here\n    return nullptr;\n}\n" },
    oracleSolutions: { python: `def merge_two_lists(list1, list2):\n  dummy = ListNode()\n  curr = dummy\n  while list1 and list2:\n    if list1.val <= list2.val:\n      curr.next = list1\n      list1 = list1.next\n    else:\n      curr.next = list2\n      list2 = list2.next\n    curr = curr.next\n  curr.next = list1 or list2\n  return dummy.next`, javascript: `function mergeTwoLists(list1, list2) {\n  const dummy = new ListNode();\n  let curr = dummy;\n  while (list1 && list2) {\n    if (list1.val <= list2.val) {\n      curr.next = list1;\n      list1 = list1.next;\n    } else {\n      curr.next = list2;\n      list2 = list2.next;\n    }\n    curr = curr.next;\n  }\n  curr.next = list1 || list2;\n  return dummy.next;\n}`, cpp: `ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n  ListNode dummy;\n  ListNode* curr = &dummy;\n  while (list1 && list2) {\n    if (list1->val <= list2->val) {\n      curr->next = list1;\n      list1 = list1->next;\n    } else {\n      curr->next = list2;\n      list2 = list2->next;\n    }\n    curr = curr->next;\n  }\n  curr->next = list1 ? list1 : list2;\n  return dummy.next;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: [[1,2,4], [1,3,4]], expected: [1,1,2,3,4,4] }, { input: [[], []], expected: [] }, { input: [[], [0]], expected: [0] }],
  },
  {
    problemId: "valid-anagram", title: "Valid Anagram",
    statement: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
    difficulty: "Easy", category: "Arrays & Hashing", tags: ["hash-table", "string", "sorting"],
    starterCode: { python: "def is_anagram(s, t):\n    # Your code here\n    pass\n", javascript: "function isAnagram(s, t) {\n  // Your code here\n}\n", cpp: "#include <string>\n#include <unordered_map>\nusing namespace std;\nbool isAnagram(string s, string t) {\n    // Your code here\n    return false;\n}\n" },
    oracleSolutions: { python: `def is_anagram(s, t):\n  return sorted(s) == sorted(t)`, javascript: `function isAnagram(s, t) {\n  return s.split('').sort().join('') === t.split('').sort().join('');\n}`, cpp: `#include <string>\n#include <algorithm>\nusing namespace std;\nbool isAnagram(string s, string t) {\n  sort(s.begin(), s.end());\n  sort(t.begin(), t.end());\n  return s == t;\n}` },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [{ input: ["anagram", "nagaram"], expected: true }, { input: ["rat", "car"], expected: false }, { input: ["", ""], expected: true }],
  },
];

const COURSE_DATA = {
  title: "Socratica Algorithm Fundamentals",
  description: "Master essential algorithms and data structures with hands-on coding challenges and AI-powered hints.",
  icon: "code",
  order: 1,
  modules: [
    {
      title: "Arrays & Hashing",
      description: "Master array manipulation and hash-based problem solving techniques.",
      order: 1,
      topics: [
        { title: "Two Sum", problemId: "two-sum" },
        { title: "Contains Duplicate", problemId: "contains-duplicate" },
        { title: "Valid Anagram", problemId: "valid-anagram" },
      ],
    },
    {
      title: "Two Pointers & Strings",
      description: "Learn the two-pointer technique for efficient string and array problems.",
      order: 2,
      topics: [
        { title: "Valid Palindrome", problemId: "palindrome" },
        { title: "Reverse String", problemId: "reverse-string" },
        { title: "Longest Common Prefix", problemId: "longest-common-prefix" },
      ],
    },
    {
      title: "Searching & Sorting",
      description: "Implement fundamental searching and sorting algorithms.",
      order: 3,
      topics: [
        { title: "Binary Search", problemId: "binary-search" },
        { title: "Bubble Sort", problemId: "bubble-sort" },
      ],
    },
    {
      title: "Dynamic Programming Foundations",
      description: "Build a strong foundation in dynamic programming with classic problems.",
      order: 4,
      topics: [
        { title: "Fibonacci Number", problemId: "fibonacci" },
        { title: "Climbing Stairs", problemId: "climbing-stairs" },
        { title: "Maximum Subarray", problemId: "max-subarray" },
      ],
    },
    {
      title: "Stacks & Linked Lists",
      description: "Master stack operations and linked list manipulation.",
      order: 5,
      topics: [
        { title: "Valid Parentheses", problemId: "valid-parentheses" },
        { title: "Merge Two Sorted Lists", problemId: "merge-two-sorted-lists" },
      ],
    },
    {
      title: "Greedy Algorithms",
      description: "Learn greedy problem-solving with real-world trading problems.",
      order: 6,
      topics: [
        { title: "Best Time to Buy and Sell Stock", problemId: "best-time-to-buy-and-sell-stock" },
      ],
    },
  ],
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB");

  // ── Users ──
  const adminPassword = await bcrypt.hash("admin123", 10);
  const testPassword = await bcrypt.hash("password123", 10);

  const admin = await User.findOneAndUpdate(
    { email: "krishnapriyakoppolu@gmail.com" },
    {
      email: "krishnapriyakoppolu@gmail.com",
      passwordHash: adminPassword,
      displayName: "Krishna Priya",
      role: "super_admin",
      emailVerified: true,
    },
    { upsert: true, new: true }
  );
  console.log(`✓ Admin user: ${admin.email} (role: ${admin.role}, pw: admin123)`);

  const testUser = await User.findOneAndUpdate(
    { email: "test@test.com" },
    {
      email: "test@test.com",
      passwordHash: testPassword,
      displayName: "Test Student",
      role: "student",
      emailVerified: true,
    },
    { upsert: true, new: true }
  );
  console.log(`✓ Test user: ${testUser.email} (role: ${testUser.role}, pw: password123)`);

  const instructorUser = await User.findOneAndUpdate(
    { email: "instructor@socratica.ai" },
    {
      email: "instructor@socratica.ai",
      passwordHash: testPassword,
      displayName: "Demo Instructor",
      role: "instructor",
      emailVerified: true,
    },
    { upsert: true, new: true }
  );
  console.log(`✓ Instructor user: ${instructorUser.email} (pw: password123)`);

  // ── Problems ──
  let problemCount = 0;
  for (const prob of PROBLEMS) {
    await Problem.findOneAndUpdate(
      { problemId: prob.problemId },
      { ...prob, description: prob.statement },
      { upsert: true, new: true }
    );
    problemCount++;
    console.log(`  ✓ Problem: ${prob.problemId}`);
  }
  console.log(`✓ Seeded ${problemCount} problems with verified oracle solutions`);

  // ── Modules & Course ──
  const moduleDocs = [];
  for (const mod of COURSE_DATA.modules) {
    const doc = await Module.findOneAndUpdate(
      { title: mod.title },
      { ...mod, course: null },
      { upsert: true, new: true }
    );
    moduleDocs.push(doc);
    console.log(`  ✓ Module: ${mod.title}`);
  }

  const course = await Course.findOneAndUpdate(
    { title: COURSE_DATA.title },
    {
      ...COURSE_DATA,
      modules: moduleDocs.map((m) => m._id),
    },
    { upsert: true, new: true }
  );

  for (const mod of moduleDocs) {
    await Module.findByIdAndUpdate(mod._id, { course: course._id });
  }
  console.log(`✓ Course: ${course.title} (${moduleDocs.length} modules)`);

  console.log("\n✓ Seeding complete!");
  console.log("  Admin:    krishnapriyakoppolu@gmail.com / admin123");
  console.log("  Student:  test@test.com / password123");
  console.log("  Instructor: instructor@socratica.ai / password123");
  console.log(`  Problems: ${problemCount}`);
  console.log(`  Course:   ${course.title}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("✗ Seed failed:", err.message);
  process.exit(1);
});
