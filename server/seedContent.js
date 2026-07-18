// seedContent.js — Seeds problems, courses, modules, test cases, and drivers.
// Called by server.js auto-seed when Problem collection is empty.
// Also runnable standalone: node seedContent.js

const Problem = require("./models/Problem");
const Course = require("./models/Course");
const Module = require("./models/Module");
const TestCase = require("./models/TestCase");
const DriverTemplate = require("./models/DriverTemplate");
const ReferenceSolution = require("./models/ReferenceSolution");

const MODULE_PROBLEMS_1_13 = [
  { problemId: "two-sum", title: "Two Sum", category: "Arrays", difficulty: "easy", tags: ["array", "hash-map", "searching"], estimatedMinutes: 15,
    statement: "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\nYou can return the answer in any order.\n\n## Constraints\n- 2 <= n <= 10,000\n- Exactly one valid solution exists.\n- O(n) time and O(n) space recommended.",
    starterCode: { python: "def twoSum(nums, target):\n    pass", javascript: "function twoSum(nums, target) {\n    \n}", cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    \n}" },
    oracleSolutions: { python: "def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []", javascript: "", cpp: "" }
  },
  { problemId: "fibonacci", title: "Fibonacci Number", category: "Dynamic Programming", difficulty: "easy", tags: ["dp", "recursion", "math"], estimatedMinutes: 10,
    statement: "The Fibonacci numbers, commonly denoted F(n), form a sequence called the Fibonacci sequence. Given n, calculate F(n).\n\nF(0) = 0, F(1) = 1\nF(n) = F(n - 1) + F(n - 2), for n > 1",
    starterCode: { python: "def fibonacci(n):\n    pass", javascript: "function fibonacci(n) {\n    \n}", cpp: "int fibonacci(int n) {\n    \n}" },
    oracleSolutions: { python: "def fibonacci(n):\n    if n <= 1: return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b", javascript: "", cpp: "" }
  },
  { problemId: "valid-parentheses", title: "Valid Parentheses", category: "Stack", difficulty: "easy", tags: ["stack", "string"], estimatedMinutes: 15,
    statement: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order.",
    starterCode: { python: "def isValid(s):\n    pass", javascript: "function isValid(s) {\n    \n}", cpp: "bool isValid(string s) {\n    \n}" },
    oracleSolutions: { python: "def isValid(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping:\n            if not stack or stack[-1] != mapping[char]:\n                return False\n            stack.pop()\n        else:\n            stack.append(char)\n    return not stack", javascript: "", cpp: "" }
  },
  { problemId: "binary-search", title: "Binary Search", category: "Search", difficulty: "easy", tags: ["binary-search", "array"], estimatedMinutes: 10,
    statement: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.",
    starterCode: { python: "def search(nums, target):\n    pass", javascript: "function search(nums, target) {\n    \n}", cpp: "int search(vector<int>& nums, int target) {\n    \n}" },
    oracleSolutions: { python: "def search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target: return mid\n        elif nums[mid] < target: lo = mid + 1\n        else: hi = mid - 1\n    return -1", javascript: "", cpp: "" }
  },
  { problemId: "reverse-linked-list", title: "Reverse Linked List", category: "Linked List", difficulty: "easy", tags: ["linked-list", "recursion"], estimatedMinutes: 15,
    statement: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    starterCode: { python: "def reverseList(head):\n    pass", javascript: "function reverseList(head) {\n    \n}", cpp: "ListNode* reverseList(ListNode* head) {\n    \n}" },
    oracleSolutions: { python: "def reverseList(head):\n    prev, curr = None, head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev", javascript: "", cpp: "" }
  },
  { problemId: "valid-palindrome", title: "Valid Palindrome", category: "Two Pointers", difficulty: "easy", tags: ["string", "two-pointers"], estimatedMinutes: 10,
    statement: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    starterCode: { python: "def isPalindrome(s):\n    pass", javascript: "function isPalindrome(s) {\n    \n}", cpp: "bool isPalindrome(string s) {\n    \n}" },
    oracleSolutions: { python: "def isPalindrome(s):\n    cleaned = ''.join(c.lower() for c in s if c.isalnum())\n    return cleaned == cleaned[::-1]", javascript: "", cpp: "" }
  },
  { problemId: "reverse-string", title: "Reverse String", category: "Two Pointers", difficulty: "easy", tags: ["string", "two-pointers"], estimatedMinutes: 5,
    statement: "Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place.",
    starterCode: { python: "def reverseString(s):\n    pass", javascript: "function reverseString(s) {\n    \n}", cpp: "void reverseString(vector<char>& s) {\n    \n}" },
    oracleSolutions: { python: "def reverseString(s):\n    s.reverse()", javascript: "", cpp: "" }
  },
  { problemId: "max-subarray", title: "Maximum Subarray", category: "Dynamic Programming", difficulty: "medium", tags: ["dp", "array", "divide-and-conquer"], estimatedMinutes: 20,
    statement: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    starterCode: { python: "def maxSubArray(nums):\n    pass", javascript: "function maxSubArray(nums) {\n    \n}", cpp: "int maxSubArray(vector<int>& nums) {\n    \n}" },
    oracleSolutions: { python: "def maxSubArray(nums):\n    max_sum = current_sum = nums[0]\n    for num in nums[1:]:\n        current_sum = max(num, current_sum + num)\n        max_sum = max(max_sum, current_sum)\n    return max_sum", javascript: "", cpp: "" }
  },
  { problemId: "contains-duplicate", title: "Contains Duplicate", category: "Arrays", difficulty: "easy", tags: ["array", "hash-set"], estimatedMinutes: 10,
    statement: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    starterCode: { python: "def containsDuplicate(nums):\n    pass", javascript: "function containsDuplicate(nums) {\n    \n}", cpp: "bool containsDuplicate(vector<int>& nums) {\n    \n}" },
    oracleSolutions: { python: "def containsDuplicate(nums):\n    return len(nums) != len(set(nums))", javascript: "", cpp: "" }
  },
  { problemId: "bubble-sort", title: "Bubble Sort", category: "Sorting", difficulty: "easy", tags: ["sorting", "array"], estimatedMinutes: 15,
    statement: "Implement the bubble sort algorithm to sort an array of integers in ascending order.",
    starterCode: { python: "def bubbleSort(arr):\n    pass", javascript: "function bubbleSort(arr) {\n    \n}", cpp: "void bubbleSort(vector<int>& arr) {\n    \n}" },
    oracleSolutions: { python: "def bubbleSort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr", javascript: "", cpp: "" }
  },
  { problemId: "climbing-stairs", title: "Climbing Stairs", category: "Dynamic Programming", difficulty: "easy", tags: ["dp", "math"], estimatedMinutes: 10,
    statement: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    starterCode: { python: "def climbStairs(n):\n    pass", javascript: "function climbStairs(n) {\n    \n}", cpp: "int climbStairs(int n) {\n    \n}" },
    oracleSolutions: { python: "def climbStairs(n):\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b", javascript: "", cpp: "" }
  },
  { problemId: "best-time-to-buy-and-sell-stock", title: "Best Time to Buy and Sell Stock", category: "Arrays", difficulty: "easy", tags: ["array", "dp"], estimatedMinutes: 15,
    statement: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
    starterCode: { python: "def maxProfit(prices):\n    pass", javascript: "function maxProfit(prices) {\n    \n}", cpp: "int maxProfit(vector<int>& prices) {\n    \n}" },
    oracleSolutions: { python: "def maxProfit(prices):\n    min_price = float('inf')\n    max_profit = 0\n    for price in prices:\n        min_price = min(min_price, price)\n        max_profit = max(max_profit, price - min_price)\n    return max_profit", javascript: "", cpp: "" }
  },
  { problemId: "longest-common-prefix", title: "Longest Common Prefix", category: "Strings", difficulty: "easy", tags: ["string"], estimatedMinutes: 10,
    statement: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
    starterCode: { python: "def longestCommonPrefix(strs):\n    pass", javascript: "function longestCommonPrefix(strs) {\n    \n}", cpp: "string longestCommonPrefix(vector<string>& strs) {\n    \n}" },
    oracleSolutions: { python: "def longestCommonPrefix(strs):\n    if not strs: return ''\n    prefix = strs[0]\n    for s in strs[1:]:\n        while not s.startswith(prefix):\n            prefix = prefix[:-1]\n            if not prefix: return ''\n    return prefix", javascript: "", cpp: "" }
  },
];

const MODULES_1_4 = [
  { title: "Data Structures & Arrays", description: "Foundational techniques for arrays, linked lists, and basic data organization.", order: 1,
    topics: [
      { title: "Two Sum", problemId: "two-sum" },
      { title: "Reverse Linked List", problemId: "reverse-linked-list" },
      { title: "Valid Parentheses", problemId: "valid-parentheses" },
      { title: "Contains Duplicate", problemId: "contains-duplicate" },
      { title: "Best Time to Buy and Sell Stock", problemId: "best-time-to-buy-and-sell-stock" },
      { title: "Longest Common Prefix", problemId: "longest-common-prefix" },
    ]},
  { title: "Strings & Palindromes", description: "String manipulation, reversal, and palindrome checking.", order: 2,
    topics: [
      { title: "Valid Palindrome", problemId: "valid-palindrome" },
      { title: "Reverse String", problemId: "reverse-string" },
    ]},
  { title: "Algorithms & Logic", description: "Intermediate algorithmic thinking, search techniques, sorting.", order: 3,
    topics: [
      { title: "Binary Search", problemId: "binary-search" },
      { title: "Bubble Sort", problemId: "bubble-sort" },
      { title: "Maximum Subarray", problemId: "max-subarray" },
    ]},
  { title: "Dynamic Programming", description: "Introduction to dynamic programming.", order: 4,
    topics: [
      { title: "Fibonacci Number", problemId: "fibonacci" },
      { title: "Climbing Stairs", problemId: "climbing-stairs" },
    ]},
];

const MODULES_5_8 = [
  { title: "Trees & Binary Trees", description: "Binary tree traversals, BST validation, and tree-based algorithms.", order: 5,
    topics: [
      { title: "Binary Tree Inorder Traversal", problemId: "binary-tree-inorder" },
      { title: "Validate Binary Search Tree", problemId: "validate-bst" },
    ]},
  { title: "Graph Algorithms", description: "Graph traversal, flood fill, topological sorting, and cycle detection.", order: 6,
    topics: [
      { title: "Number of Islands", problemId: "number-of-islands" },
      { title: "Course Schedule", problemId: "course-schedule" },
    ]},
  { title: "Advanced Data Structures", description: "Heaps, LRU caches, and advanced data structure design problems.", order: 7,
    topics: [
      { title: "Merge k Sorted Lists", problemId: "merge-k-sorted-lists" },
      { title: "LRU Cache", problemId: "lru-cache" },
    ]},
  { title: "Advanced Algorithms", description: "Stack-based algorithms, dynamic programming optimization, backtracking, and binary search on answer.", order: 8,
    topics: [
      { title: "Trapping Rain Water", problemId: "trapping-rain-water" },
      { title: "Word Break", problemId: "word-break" },
      { title: "N-Queens", problemId: "n-queens" },
      { title: "Median of Two Sorted Arrays", problemId: "median-of-two-sorted-arrays" },
    ]},
];

const ADVANCED_PROBLEMS = [
  { problemId: "binary-tree-inorder", title: "Binary Tree Inorder Traversal", category: "Trees", difficulty: "easy", tags: ["tree", "dfs", "recursion"],
    statement: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
    starterCode: { python: "def inorderTraversal(root):\n    pass", javascript: "function inorderTraversal(root) {\n    \n}", cpp: "vector<int> inorderTraversal(TreeNode* root) {\n    \n}" },
    oracleSolutions: { python: "def inorderTraversal(root):\n    if not root: return []\n    return inorderTraversal(root.left) + [root.val] + inorderTraversal(root.right)", javascript: "", cpp: "" }
  },
  { problemId: "validate-bst", title: "Validate Binary Search Tree", category: "Trees", difficulty: "medium", tags: ["tree", "bst", "dfs"],
    statement: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
    starterCode: { python: "def isValidBST(root):\n    pass", javascript: "function isValidBST(root) {\n    \n}", cpp: "bool isValidBST(TreeNode* root) {\n    \n}" },
    oracleSolutions: { python: "def isValidBST(root):\n    def validate(node, low, high):\n        if not node: return True\n        if node.val <= low or node.val >= high: return False\n        return validate(node.left, low, node.val) and validate(node.right, node.val, high)\n    return validate(root, float('-inf'), float('inf'))", javascript: "", cpp: "" }
  },
  { problemId: "number-of-islands", title: "Number of Islands", category: "Graphs", difficulty: "medium", tags: ["graph", "dfs", "bfs", "matrix"],
    statement: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
    starterCode: { python: "def numIslands(grid):\n    pass", javascript: "function numIslands(grid) {\n    \n}", cpp: "int numIslands(vector<vector<char>>& grid) {\n    \n}" },
    oracleSolutions: { python: "def numIslands(grid):\n    if not grid: return 0\n    count = 0\n    for i in range(len(grid)):\n        for j in range(len(grid[0])):\n            if grid[i][j] == '1':\n                dfs(grid, i, j)\n                count += 1\n    return count\n\ndef dfs(grid, i, j):\n    if i < 0 or i >= len(grid) or j < 0 or j >= len(grid[0]) or grid[i][j] != '1': return\n    grid[i][j] = '0'\n    dfs(grid, i+1, j); dfs(grid, i-1, j); dfs(grid, i, j+1); dfs(grid, i, j-1)", javascript: "", cpp: "" }
  },
  { problemId: "course-schedule", title: "Course Schedule", category: "Graphs", difficulty: "medium", tags: ["graph", "topological-sort", "cycle-detection"],
    statement: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. Determine if you can finish all courses.",
    starterCode: { python: "def canFinish(numCourses, prerequisites):\n    pass", javascript: "function canFinish(numCourses, prerequisites) {\n    \n}", cpp: "bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n    \n}" },
    oracleSolutions: { python: "def canFinish(numCourses, prerequisites):\n    graph = [[] for _ in range(numCourses)]\n    for c, p in prerequisites: graph[c].append(p)\n    visited = [0] * numCourses\n    def dfs(n):\n        if visited[n] == 1: return False\n        if visited[n] == 2: return True\n        visited[n] = 1\n        for nb in graph[n]:\n            if not dfs(nb): return False\n        visited[n] = 2\n        return True\n    return all(dfs(i) for i in range(numCourses))", javascript: "", cpp: "" }
  },
  { problemId: "merge-k-sorted-lists", title: "Merge k Sorted Lists", category: "Heaps", difficulty: "hard", tags: ["heap", "linked-list", "divide-and-conquer"],
    statement: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list.",
    starterCode: { python: "def mergeKLists(lists):\n    pass", javascript: "function mergeKLists(lists) {\n    \n}", cpp: "ListNode* mergeKLists(vector<ListNode*>& lists) {\n    \n}" },
    oracleSolutions: { python: "import heapq\ndef mergeKLists(lists):\n    heap = []\n    for i, l in enumerate(lists):\n        if l: heapq.heappush(heap, (l.val, i, l))\n    dummy = ListNode(0)\n    curr = dummy\n    while heap:\n        val, i, node = heapq.heappop(heap)\n        curr.next = node\n        curr = curr.next\n        if node.next: heapq.heappush(heap, (node.next.val, i, node.next))\n    return dummy.next", javascript: "", cpp: "" }
  },
  { problemId: "word-break", title: "Word Break", category: "Dynamic Programming", difficulty: "medium", tags: ["dp", "string", "trie"],
    statement: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.",
    starterCode: { python: "def wordBreak(s, wordDict):\n    pass", javascript: "function wordBreak(s, wordDict) {\n    \n}", cpp: "bool wordBreak(string s, vector<string>& wordDict) {\n    \n}" },
    oracleSolutions: { python: "def wordBreak(s, wordDict):\n    wordSet = set(wordDict)\n    dp = [False] * (len(s) + 1)\n    dp[0] = True\n    for i in range(1, len(s) + 1):\n        for j in range(i):\n            if dp[j] and s[j:i] in wordSet:\n                dp[i] = True\n                break\n    return dp[len(s)]", javascript: "", cpp: "" }
  },
  { problemId: "lru-cache", title: "LRU Cache", category: "Design", difficulty: "hard", tags: ["design", "hashmap", "linked-list"],
    statement: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
    starterCode: { python: "class LRUCache:\n    def __init__(self, capacity):\n        pass\n    def get(self, key):\n        pass\n    def put(self, key, value):\n        pass", javascript: "class LRUCache {\n    constructor(capacity) { }\n    get(key) { }\n    put(key, value) { }\n}", cpp: "class LRUCache {\npublic:\n    LRUCache(int capacity) { }\n    int get(int key) { }\n    void put(int key, int value) { }\n};" },
    oracleSolutions: { python: "class LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.cache = {}\n        self.order = []\n    def get(self, key):\n        if key in self.cache:\n            self.order.remove(key)\n            self.order.append(key)\n            return self.cache[key]\n        return -1\n    def put(self, key, value):\n        if key in self.cache: self.order.remove(key)\n        elif len(self.cache) >= self.capacity:\n            del self.cache[self.order.pop(0)]\n        self.cache[key] = value\n        self.order.append(key)", javascript: "", cpp: "" }
  },
  { problemId: "trapping-rain-water", title: "Trapping Rain Water", category: "Stack", difficulty: "hard", tags: ["stack", "two-pointers", "dynamic-programming"],
    statement: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    starterCode: { python: "def trap(height):\n    pass", javascript: "function trap(height) {\n    \n}", cpp: "int trap(vector<int>& height) {\n    \n}" },
    oracleSolutions: { python: "def trap(height):\n    if not height: return 0\n    left, right = 0, len(height) - 1\n    leftMax, rightMax = height[left], height[right]\n    water = 0\n    while left < right:\n        if leftMax < rightMax:\n            left += 1\n            leftMax = max(leftMax, height[left])\n            water += leftMax - height[left]\n        else:\n            right -= 1\n            rightMax = max(rightMax, height[right])\n            water += rightMax - height[right]\n    return water", javascript: "", cpp: "" }
  },
  { problemId: "n-queens", title: "N-Queens", category: "Backtracking", difficulty: "hard", tags: ["backtracking", "recursion", "matrix"],
    statement: "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.",
    starterCode: { python: "def solveNQueens(n):\n    pass", javascript: "function solveNQueens(n) {\n    \n}", cpp: "vector<vector<string>> solveNQueens(int n) {\n    \n}" },
    oracleSolutions: { python: "def solveNQueens(n):\n    def backtrack(row, cols, d1, d2, board):\n        if row == n:\n            result.append([''.join(r) for r in board])\n            return\n        for col in range(n):\n            if col in cols or row-col in d1 or row+col in d2: continue\n            board[row][col] = 'Q'\n            backtrack(row+1, cols|{col}, d1|{row-col}, d2|{row+col}, board)\n            board[row][col] = '.'\n    result = []\n    backtrack(0, set(), set(), set(), [['.' for _ in range(n)] for _ in range(n)])\n    return result", javascript: "", cpp: "" }
  },
  { problemId: "median-of-two-sorted-arrays", title: "Median of Two Sorted Arrays", category: "Binary Search", difficulty: "hard", tags: ["binary-search", "array", "divide-and-conquer"],
    statement: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
    starterCode: { python: "def findMedianSortedArrays(nums1, nums2):\n    pass", javascript: "function findMedianSortedArrays(nums1, nums2) {\n    \n}", cpp: "double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n    \n}" },
    oracleSolutions: { python: "def findMedianSortedArrays(nums1, nums2):\n    if len(nums1) > len(nums2): nums1, nums2 = nums2, nums1\n    x, y = len(nums1), len(nums2)\n    lo, hi = 0, x\n    while lo <= hi:\n        px = (lo + hi) // 2\n        py = (x + y + 1) // 2 - px\n        mxL = float('-inf') if px == 0 else nums1[px-1]\n        mnR = float('inf') if px == x else nums1[px]\n        myL = float('-inf') if py == 0 else nums2[py-1]\n        mnY = float('inf') if py == y else nums2[py]\n        if mxL <= mnY and myL <= mnR:\n            if (x+y) % 2 == 0: return (max(mxL, myL) + min(mnR, mnY)) / 2\n            else: return max(mxL, myL)\n        elif mxL > mnY: hi = px - 1\n        else: lo = px + 1", javascript: "", cpp: "" }
  },
];

async function seedContent() {
  const problemCount = await Problem.countDocuments();
  if (problemCount > 0) {
    console.log("[seedContent] Problems already exist, skipping");
    return { created: 0, skipped: true };
  }

  console.log("[seedContent] Seeding problems, courses, modules...");

  // 1. Create problems 1-13
  let created = 0;
  for (const p of MODULE_PROBLEMS_1_13) {
    const exists = await Problem.findOne({ problemId: p.problemId });
    if (!exists) { await Problem.create(p); created++; }
  }

  // 2. Create advanced problems 14-23
  for (const p of ADVANCED_PROBLEMS) {
    const exists = await Problem.findOne({ problemId: p.problemId });
    if (!exists) { await Problem.create(p); created++; }
  }
  console.log(`[seedContent] Created ${created} problems`);

  // 3. Create course
  let course = await Course.findOne({ title: "Core Computer Science" });
  if (!course) {
    course = await Course.create({
      title: "Core Computer Science",
      description: "Master the fundamental algorithms and data structures required for technical interviews and systems engineering.",
      icon: "school", order: 1,
    });
  }

  // 4. Create modules 1-4
  let modulesCreated = 0;
  for (const mod of MODULES_1_4) {
    const exists = await Module.findOne({ title: mod.title });
    if (!exists) {
      const m = await Module.create({ ...mod, course: course._id });
      modulesCreated++;
    }
  }

  // 5. Create modules 5-8 (advanced)
  for (const mod of MODULES_5_8) {
    const exists = await Module.findOne({ title: mod.title });
    if (!exists) {
      const m = await Module.create({ ...mod, course: course._id });
      modulesCreated++;
    }
  }
  console.log(`[seedContent] Created ${modulesCreated} modules`);

  // 6. Update course module list
  const allModules = await Module.find({ course: course._id }).sort({ order: 1 });
  course.modules = allModules.map(m => m._id);
  await course.save();

  console.log("[seedContent] Done");
  return { created, skipped: false };
}

if (require.main === module) {
  const mongoose = require("mongoose");
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";
  mongoose.connect(MONGO_URI).then(() => seedContent()).then(() => mongoose.disconnect()).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = seedContent;
