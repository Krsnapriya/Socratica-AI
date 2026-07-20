// seedReferenceSolutions.js — Seeds JS/C++ oracle solutions + ReferenceSolution entries
// Usage: node seedReferenceSolutions.js

require("dotenv").config();
const mongoose = require("mongoose");
const Problem = require("./models/Problem");
const ReferenceSolution = require("./models/ReferenceSolution");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

const JS_ORACLES = {
  "two-sum": `function twoSum(nums, target) {\n  const seen = {};\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (complement in seen) return [seen[complement], i];\n    seen[nums[i]] = i;\n  }\n  return [];\n}`,
  "fibonacci": `function fibonacci(n) {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}`,
  "valid-parentheses": `function isValid(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (const c of s) {\n    if (c in map) {\n      if (!stack.length || stack[stack.length - 1] !== map[c]) return false;\n      stack.pop();\n    } else {\n      stack.push(c);\n    }\n  }\n  return stack.length === 0;\n}`,
  "binary-search": `function search(nums, target) {\n  let lo = 0, hi = nums.length - 1;\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (nums[mid] === target) return mid;\n    else if (nums[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}`,
  "reverse-linked-list": `function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    const nxt = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = nxt;\n  }\n  return prev;\n}`,
  "valid-palindrome": `function isPalindrome(s) {\n  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return cleaned === cleaned.split('').reverse().join('');\n}`,
  "reverse-string": `function reverseString(s) {\n  let l = 0, r = s.length - 1;\n  while (l < r) {\n    [s[l], s[r]] = [s[r], s[l]];\n    l++;\n    r--;\n  }\n}`,
  "max-subarray": `function maxSubArray(nums) {\n  let maxSum = nums[0], curSum = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    curSum = Math.max(nums[i], curSum + nums[i]);\n    maxSum = Math.max(maxSum, curSum);\n  }\n  return maxSum;\n}`,
  "contains-duplicate": `function containsDuplicate(nums) {\n  return new Set(nums).size !== nums.length;\n}`,
  "bubble-sort": `function bubbleSort(arr) {\n  const n = arr.length;\n  for (let i = 0; i < n; i++) {\n    for (let j = 0; j < n - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}`,
  "climbing-stairs": `function climbStairs(n) {\n  if (n <= 2) return n;\n  let a = 1, b = 2;\n  for (let i = 3; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}`,
  "best-time-to-buy-and-sell-stock": `function maxProfit(prices) {\n  let minPrice = Infinity, maxProfit = 0;\n  for (const price of prices) {\n    minPrice = Math.min(minPrice, price);\n    maxProfit = Math.max(maxProfit, price - minPrice);\n  }\n  return maxProfit;\n}`,
  "longest-common-prefix": `function longestCommonPrefix(strs) {\n  if (!strs.length) return '';\n  let prefix = strs[0];\n  for (let i = 1; i < strs.length; i++) {\n    while (strs[i].indexOf(prefix) !== 0) {\n      prefix = prefix.slice(0, -1);\n      if (!prefix) return '';\n    }\n  }\n  return prefix;\n}`,
  "binary-tree-inorder": `function inorderTraversal(root) {\n  if (!root) return [];\n  return [...inorderTraversal(root.left), root.val, ...inorderTraversal(root.right)];\n}`,
  "validate-bst": `function isValidBST(root) {\n  function validate(node, low, high) {\n    if (!node) return true;\n    if (node.val <= low || node.val >= high) return false;\n    return validate(node.left, low, node.val) && validate(node.right, node.val, high);\n  }\n  return validate(root, -Infinity, Infinity);\n}`,
  "number-of-islands": `function numIslands(grid) {\n  if (!grid.length) return 0;\n  let count = 0;\n  const dfs = (i, j) => {\n    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length || grid[i][j] !== '1') return;\n    grid[i][j] = '0';\n    dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1);\n  };\n  for (let i = 0; i < grid.length; i++) {\n    for (let j = 0; j < grid[0].length; j++) {\n      if (grid[i][j] === '1') { dfs(i, j); count++; }\n    }\n  }\n  return count;\n}`,
  "course-schedule": `function canFinish(numCourses, prerequisites) {\n  const graph = Array.from({ length: numCourses }, () => []);\n  for (const [c, p] of prerequisites) graph[c].push(p);\n  const visited = Array(numCourses).fill(0);\n  const dfs = (n) => {\n    if (visited[n] === 1) return false;\n    if (visited[n] === 2) return true;\n    visited[n] = 1;\n    for (const nb of graph[n]) {\n      if (!dfs(nb)) return false;\n    }\n    visited[n] = 2;\n    return true;\n  };\n  return Array.from({ length: numCourses }, (_, i) => i).every(dfs);\n}`,
  "merge-k-sorted-lists": `function mergeKLists(lists) {\n  const heap = [];\n  const push = (node, i) => {\n    heap.push({ val: node.val, idx: i, node });\n    let c = heap.length - 1;\n    while (c > 0) {\n      const p = Math.floor((c - 1) / 2);\n      if (heap[p].val <= heap[c].val) break;\n      [heap[p], heap[c]] = [heap[c], heap[p]];\n      c = p;\n    }\n  };\n  const pop = () => {\n    const top = heap[0];\n    const last = heap.pop();\n    if (heap.length) { heap[0] = last; let c = 0; while (true) {\n      let s = c, l = 2*c+1, r = 2*c+2;\n      if (l < heap.length && heap[l].val < heap[s].val) s = l;\n      if (r < heap.length && heap[r].val < heap[s].val) s = r;\n      if (s === c) break;\n      [heap[c], heap[s]] = [heap[s], heap[c]]; c = s;\n    }}\n    return top;\n  };\n  for (let i = 0; i < lists.length; i++) {\n    if (lists[i]) push(lists[i], i);\n  }\n  const dummy = { val: 0, next: null };\n  let curr = dummy;\n  while (heap.length) {\n    const { node, idx } = pop();\n    curr.next = node;\n    curr = curr.next;\n    if (node.next) push(node.next, idx);\n  }\n  return dummy.next;\n}`,
  "word-break": `function wordBreak(s, wordDict) {\n  const wordSet = new Set(wordDict);\n  const dp = Array(s.length + 1).fill(false);\n  dp[0] = true;\n  for (let i = 1; i <= s.length; i++) {\n    for (let j = 0; j < i; j++) {\n      if (dp[j] && wordSet.has(s.slice(j, i))) {\n        dp[i] = true;\n        break;\n      }\n    }\n  }\n  return dp[s.length];\n}`,
  "lru-cache": `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n  put(key, value) {\n    this.cache.delete(key);\n    this.cache.set(key, value);\n    if (this.cache.size > this.capacity) {\n      this.cache.delete(this.cache.keys().next().value);\n    }\n  }\n}`,
  "trapping-rain-water": `function trap(height) {\n  if (!height.length) return 0;\n  let left = 0, right = height.length - 1;\n  let leftMax = height[left], rightMax = height[right];\n  let water = 0;\n  while (left < right) {\n    if (leftMax < rightMax) {\n      left++;\n      leftMax = Math.max(leftMax, height[left]);\n      water += leftMax - height[left];\n    } else {\n      right--;\n      rightMax = Math.max(rightMax, height[right]);\n      water += rightMax - height[right];\n    }\n  }\n  return water;\n}`,
  "n-queens": `function solveNQueens(n) {\n  const result = [];\n  const board = Array.from({ length: n }, () => Array(n).fill('.'));\n  const backtrack = (row, cols, d1, d2) => {\n    if (row === n) {\n      result.push(board.map(r => r.join('')));\n      return;\n    }\n    for (let col = 0; col < n; col++) {\n      if (cols.has(col) || d1.has(row - col) || d2.has(row + col)) continue;\n      board[row][col] = 'Q';\n      cols.add(col); d1.add(row - col); d2.add(row + col);\n      backtrack(row + 1, cols, d1, d2);\n      board[row][col] = '.';\n      cols.delete(col); d1.delete(row - col); d2.delete(row + col);\n    }\n  };\n  backtrack(0, new Set(), new Set(), new Set());\n  return result;\n}`,
  "median-of-two-sorted-arrays": `function findMedianSortedArrays(nums1, nums2) {\n  if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1];\n  const x = nums1.length, y = nums2.length;\n  let lo = 0, hi = x;\n  while (lo <= hi) {\n    const px = Math.floor((lo + hi) / 2);\n    const py = Math.floor((x + y + 1) / 2) - px;\n    const mxL = px === 0 ? -Infinity : nums1[px - 1];\n    const mnR = px === x ? Infinity : nums1[px];\n    const myL = py === 0 ? -Infinity : nums2[py - 1];\n    const mnY = py === y ? Infinity : nums2[py];\n    if (mxL <= mnY && myL <= mnR) {\n      if ((x + y) % 2 === 0) return (Math.max(mxL, myL) + Math.min(mnR, mnY)) / 2;\n      return Math.max(mxL, myL);\n    } else if (mxL > mnY) hi = px - 1;\n    else lo = px + 1;\n  }\n}`,
};

const CPP_ORACLES = {
  "two-sum": `vector<int> twoSum(vector<int>& nums, int target) {\n  unordered_map<int, int> seen;\n  for (int i = 0; i < nums.size(); i++) {\n    int complement = target - nums[i];\n    if (seen.count(complement)) return {seen[complement], i};\n    seen[nums[i]] = i;\n  }\n  return {};\n}`,
  "fibonacci": `int fibonacci(int n) {\n  if (n <= 1) return n;\n  int a = 0, b = 1;\n  for (int i = 2; i <= n; i++) {\n    int tmp = b;\n    b = a + b;\n    a = tmp;\n  }\n  return b;\n}`,
  "valid-parentheses": `bool isValid(string s) {\n  stack<char> st;\n  unordered_map<char, char> map = {{')','('},{'}','{'},{']','['}};\n  for (char c : s) {\n    if (map.count(c)) {\n      if (st.empty() || st.top() != map[c]) return false;\n      st.pop();\n    } else {\n      st.push(c);\n    }\n  }\n  return st.empty();\n}`,
  "binary-search": `int search(vector<int>& nums, int target) {\n  int lo = 0, hi = nums.size() - 1;\n  while (lo <= hi) {\n    int mid = lo + (hi - lo) / 2;\n    if (nums[mid] == target) return mid;\n    else if (nums[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}`,
  "reverse-linked-list": `ListNode* reverseList(ListNode* head) {\n  ListNode* prev = nullptr;\n  ListNode* curr = head;\n  while (curr) {\n    ListNode* nxt = curr->next;\n    curr->next = prev;\n    prev = curr;\n    curr = nxt;\n  }\n  return prev;\n}`,
  "valid-palindrome": `bool isPalindrome(string s) {\n  string cleaned;\n  for (char c : s) {\n    if (isalnum(c)) cleaned += tolower(c);\n  }\n  string rev = cleaned;\n  reverse(rev.begin(), rev.end());\n  return cleaned == rev;\n}`,
  "reverse-string": `void reverseString(vector<char>& s) {\n  int l = 0, r = s.size() - 1;\n  while (l < r) swap(s[l++], s[r--]);\n}`,
  "max-subarray": `int maxSubArray(vector<int>& nums) {\n  int maxSum = nums[0], curSum = nums[0];\n  for (int i = 1; i < nums.size(); i++) {\n    curSum = max(nums[i], curSum + nums[i]);\n    maxSum = max(maxSum, curSum);\n  }\n  return maxSum;\n}`,
  "contains-duplicate": `bool containsDuplicate(vector<int>& nums) {\n  unordered_set<int> s(nums.begin(), nums.end());\n  return s.size() != nums.size();\n}`,
  "bubble-sort": `void bubbleSort(vector<int>& arr) {\n  int n = arr.size();\n  for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) swap(arr[j], arr[j + 1]);\n    }\n  }\n}`,
  "climbing-stairs": `int climbStairs(int n) {\n  if (n <= 2) return n;\n  int a = 1, b = 2;\n  for (int i = 3; i <= n; i++) {\n    int tmp = b;\n    b = a + b;\n    a = tmp;\n  }\n  return b;\n}`,
  "best-time-to-buy-and-sell-stock": `int maxProfit(vector<int>& prices) {\n  int minPrice = INT_MAX, maxProfit = 0;\n  for (int price : prices) {\n    minPrice = min(minPrice, price);\n    maxProfit = max(maxProfit, price - minPrice);\n  }\n  return maxProfit;\n}`,
  "longest-common-prefix": `string longestCommonPrefix(vector<string>& strs) {\n  if (strs.empty()) return "";\n  string prefix = strs[0];\n  for (int i = 1; i < strs.size(); i++) {\n    while (strs[i].find(prefix) != 0) {\n      prefix = prefix.substr(0, prefix.size() - 1);\n      if (prefix.empty()) return "";\n    }\n  }\n  return prefix;\n}`,
  "binary-tree-inorder": `vector<int> inorderTraversal(TreeNode* root) {\n  if (!root) return {};\n  vector<int> result;\n  auto left = inorderTraversal(root->left);\n  result.insert(result.end(), left.begin(), left.end());\n  result.push_back(root->val);\n  auto right = inorderTraversal(root->right);\n  result.insert(result.end(), right.begin(), right.end());\n  return result;\n}`,
  "validate-bst": `bool isValidBST(TreeNode* root) {\n  function<bool(TreeNode*, long, long)> validate = [&](TreeNode* node, long low, long high) {\n    if (!node) return true;\n    if (node->val <= low || node->val >= high) return false;\n    return validate(node->left, low, node->val) && validate(node->right, node->val, high);\n  };\n  return validate(root, LLONG_MIN, LLONG_MAX);\n}`,
  "number-of-islands": `int numIslands(vector<vector<char>>& grid) {\n  if (grid.empty()) return 0;\n  int count = 0;\n  function<void(int, int)> dfs = [&](int i, int j) {\n    if (i < 0 || i >= grid.size() || j < 0 || j >= grid[0].size() || grid[i][j] != '1') return;\n    grid[i][j] = '0';\n    dfs(i+1, j); dfs(i-1, j); dfs(i, j+1); dfs(i, j-1);\n  };\n  for (int i = 0; i < grid.size(); i++)\n    for (int j = 0; j < grid[0].size(); j++)\n      if (grid[i][j] == '1') { dfs(i, j); count++; }\n  return count;\n}`,
  "course-schedule": `bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n  vector<vector<int>> graph(numCourses);\n  for (auto& p : prerequisites) graph[p[0]].push_back(p[1]);\n  vector<int> visited(numCourses, 0);\n  function<bool(int)> dfs = [&](int n) {\n    if (visited[n] == 1) return false;\n    if (visited[n] == 2) return true;\n    visited[n] = 1;\n    for (int nb : graph[n])\n      if (!dfs(nb)) return false;\n    visited[n] = 2;\n    return true;\n  };\n  for (int i = 0; i < numCourses; i++)\n    if (!dfs(i)) return false;\n  return true;\n}`,
  "merge-k-sorted-lists": `ListNode* mergeKLists(vector<ListNode*>& lists) {\n  auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };\n  priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);\n  for (auto l : lists) if (l) pq.push(l);\n  ListNode dummy(0);\n  ListNode* curr = &dummy;\n  while (!pq.empty()) {\n    ListNode* node = pq.top(); pq.pop();\n    curr->next = node;\n    curr = curr->next;\n    if (node->next) pq.push(node->next);\n  }\n  return dummy.next;\n}`,
  "word-break": `bool wordBreak(string s, vector<string>& wordDict) {\n  unordered_set<string> wordSet(wordDict.begin(), wordDict.end());\n  vector<bool> dp(s.size() + 1, false);\n  dp[0] = true;\n  for (int i = 1; i <= s.size(); i++) {\n    for (int j = 0; j < i; j++) {\n      if (dp[j] && wordSet.count(s.substr(j, i - j))) {\n        dp[i] = true;\n        break;\n      }\n    }\n  }\n  return dp[s.size()];\n}`,
  "lru-cache": `class LRUCache {\n  int capacity;\n  list<pair<int,int>> cache;\n  unordered_map<int, list<pair<int,int>>::iterator> map;\npublic:\n  LRUCache(int cap) : capacity(cap) {}\n  int get(int key) {\n    if (!map.count(key)) return -1;\n    cache.splice(cache.begin(), cache, map[key]);\n    return map[key]->second;\n  }\n  void put(int key, int value) {\n    if (map.count(key)) cache.erase(map[key]);\n    cache.emplace_front(key, value);\n    map[key] = cache.begin();\n    if (cache.size() > capacity) {\n      map.erase(cache.back().first);\n      cache.pop_back();\n    }\n  }\n};`,
  "trapping-rain-water": `int trap(vector<int>& height) {\n  if (height.empty()) return 0;\n  int left = 0, right = height.size() - 1;\n  int leftMax = height[left], rightMax = height[right];\n  int water = 0;\n  while (left < right) {\n    if (leftMax < rightMax) {\n      left++;\n      leftMax = max(leftMax, height[left]);\n      water += leftMax - height[left];\n    } else {\n      right--;\n      rightMax = max(rightMax, height[right]);\n      water += rightMax - height[right];\n    }\n  }\n  return water;\n}`,
  "n-queens": `vector<vector<string>> solveNQueens(int n) {\n  vector<vector<string>> result;\n  vector<string> board(n, string(n, '.'));\n  unordered_set<int> cols, d1, d2;\n  function<void(int)> backtrack = [&](int row) {\n    if (row == n) {\n      result.push_back(board);\n      return;\n    }\n    for (int col = 0; col < n; col++) {\n      if (cols.count(col) || d1.count(row-col) || d2.count(row+col)) continue;\n      board[row][col] = 'Q';\n      cols.insert(col); d1.insert(row-col); d2.insert(row+col);\n      backtrack(row+1);\n      board[row][col] = '.';\n      cols.erase(col); d1.erase(row-col); d2.erase(row+col);\n    }\n  };\n  backtrack(0);\n  return result;\n}`,
  "median-of-two-sorted-arrays": `double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n  if (nums1.size() > nums2.size()) swap(nums1, nums2);\n  int x = nums1.size(), y = nums2.size();\n  int lo = 0, hi = x;\n  while (lo <= hi) {\n    int px = (lo + hi) / 2;\n    int py = (x + y + 1) / 2 - px;\n    double mxL = px == 0 ? INT_MIN : nums1[px-1];\n    double mnR = px == x ? INT_MAX : nums1[px];\n    double myL = py == 0 ? INT_MIN : nums2[py-1];\n    double mnY = py == y ? INT_MAX : nums2[py];\n    if (mxL <= mnY && myL <= mnR) {\n      if ((x+y) % 2 == 0) return (max(mxL,myL) + min(mnR,mnY)) / 2.0;\n      return max(mxL, myL);\n    } else if (mxL > mnY) hi = px - 1;\n    else lo = px + 1;\n  }\n  return 0;\n}`,
};

const ALGORITHMS = {
  "two-sum": "Hash Map Lookup",
  "fibonacci": "Iterative DP",
  "valid-parentheses": "Stack Matching",
  "binary-search": "Binary Search",
  "reverse-linked-list": "Iterative Pointer Reversal",
  "valid-palindrome": "Two Pointers / String Cleaning",
  "reverse-string": "Two Pointers In-Place Swap",
  "max-subarray": "Kadane's Algorithm",
  "contains-duplicate": "Hash Set Size Check",
  "bubble-sort": "Bubble Sort",
  "climbing-stairs": "Iterative DP (Fibonacci variant)",
  "best-time-to-buy-and-sell-stock": "Single Pass Min Tracking",
  "longest-common-prefix": "Horizontal Scanning",
  "binary-tree-inorder": "Recursive DFS",
  "validate-bst": "Recursive Range Validation",
  "number-of-islands": "DFS Flood Fill",
  "course-schedule": "DFS Cycle Detection",
  "merge-k-sorted-lists": "Min-Heap",
  "word-break": "DP with HashSet",
  "lru-cache": "Hash Map + Doubly Linked List / OrderedDict",
  "trapping-rain-water": "Two Pointers",
  "n-queens": "Backtracking",
  "median-of-two-sorted-arrays": "Binary Search on Partition",
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("[seedReferenceSolutions] Connected to MongoDB");

  const problems = await Problem.find({});
  console.log(`[seedReferenceSolutions] Found ${problems.length} problems`);

  let updated = 0;
  let refSolCreated = 0;

  for (const problem of problems) {
    const pid = problem.problemId;
    const jsCode = JS_ORACLES[pid];
    const cppCode = CPP_ORACLES[pid];
    if (!jsCode && !cppCode) {
      console.log(`  Skipping ${pid} (no JS/C++ solutions defined)`);
      continue;
    }

    // Update Problem.oracleSolutions with JS and C++
    const update = {};
    if (jsCode && !problem.oracleSolutions?.javascript) update["oracleSolutions.javascript"] = jsCode;
    if (cppCode && !problem.oracleSolutions?.cpp) update["oracleSolutions.cpp"] = cppCode;

    if (Object.keys(update).length > 0) {
      await Problem.updateOne({ _id: problem._id }, { $set: update });
      updated++;
      console.log(`  Updated oracleSolutions for ${pid}: JS=${!!jsCode}, C++=${!!cppCode}`);
    }

    // Create ReferenceSolution entries for all 3 languages
    const langs = [
      { lang: "python", code: problem.oracleSolutions?.python },
      { lang: "javascript", code: jsCode },
      { lang: "cpp", code: cppCode },
    ];

    for (const { lang, code } of langs) {
      if (!code) continue;
      const exists = await ReferenceSolution.findOne({ problemId: pid, language: lang, variant: "standard" });
      if (!exists) {
        await ReferenceSolution.create({
          problemId: pid,
          language: lang,
          variant: "standard",
          code,
          algorithm: ALGORITHMS[pid] || "",
          timeComplexity: "",
          spaceComplexity: "",
          isPrimary: true,
          verified: true,
        });
        refSolCreated++;
      }
    }
  }

  console.log(`[seedReferenceSolutions] Updated ${updated} problems, created ${refSolCreated} reference solutions`);
  await mongoose.disconnect();
  console.log("[seedReferenceSolutions] Done");
}

if (require.main === module) {
  seed().catch(err => { console.error(err); process.exit(1); });
}

module.exports = seed;
