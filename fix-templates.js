const mongoose = require('mongoose');
const Problem = require('./server/models/Problem');

const templates = {
  python: {
    'two-sum': 'def twoSum(nums, target):\n    pass',
    'fibonacci': 'def fib(n):\n    pass',
    'valid-parentheses': 'def isValid(s):\n    pass',
    'binary-search': 'def search(nums, target):\n    pass',
    'reverse-linked-list': 'def reverseList(head):\n    pass',
    'valid-palindrome': 'def isPalindrome(s):\n    pass',
    'reverse-string': 'def reverseString(s):\n    pass',
    'max-subarray': 'def maxSubArray(nums):\n    pass',
    'contains-duplicate': 'def containsDuplicate(nums):\n    pass',
    'bubble-sort': 'def bubbleSort(arr):\n    pass',
    'climbing-stairs': 'def climbStairs(n):\n    pass',
    'best-time-to-buy-and-sell-stock': 'def maxProfit(prices):\n    pass',
    'longest-common-prefix': 'def longestCommonPrefix(strs):\n    pass',
    'binary-tree-inorder': 'def inorderTraversal(root):\n    pass',
    'validate-bst': 'def isValidBST(root):\n    pass',
    'number-of-islands': 'def numIslands(grid):\n    pass',
    'course-schedule': 'def canFinish(numCourses, prerequisites):\n    pass',
    'merge-k-sorted-lists': 'def mergeKLists(lists):\n    pass',
    'word-break': 'def wordBreak(s, wordDict):\n    pass',
    'lru-cache': 'class LRUCache:\n    def __init__(self, capacity):\n        pass\n    def get(self, key):\n        pass\n    def put(self, key, value):\n        pass',
    'trapping-rain-water': 'def trap(height):\n    pass',
    'n-queens': 'def solveNQueens(n):\n    pass',
    'median-of-two-sorted-arrays': 'def findMedianSortedArrays(nums1, nums2):\n    pass',
  },
  javascript: {
    'two-sum': 'function twoSum(nums, target) {\n    pass\n}',
    'fibonacci': 'function fibonacci(n) {\n    pass\n}',
    'valid-parentheses': 'function isValid(s) {\n    pass\n}',
    'binary-search': 'function search(nums, target) {\n    pass\n}',
    'reverse-linked-list': 'function reverseList(head) {\n    pass\n}',
    'valid-palindrome': 'function isPalindrome(s) {\n    pass\n}',
    'reverse-string': 'function reverseString(s) {\n    pass\n}',
    'max-subarray': 'function maxSubArray(nums) {\n    pass\n}',
    'contains-duplicate': 'function containsDuplicate(nums) {\n    pass\n}',
    'bubble-sort': 'function bubbleSort(arr) {\n    pass\n}',
    'climbing-stairs': 'function climbStairs(n) {\n    pass\n}',
    'best-time-to-buy-and-sell-stock': 'function maxProfit(prices) {\n    pass\n}',
    'longest-common-prefix': 'function longestCommonPrefix(strs) {\n    pass\n}',
    'binary-tree-inorder': 'function inorderTraversal(root) {\n    pass\n}',
    'validate-bst': 'function isValidBST(root) {\n    pass\n}',
    'number-of-islands': 'function numIslands(grid) {\n    pass\n}',
    'course-schedule': 'function canFinish(numCourses, prerequisites) {\n    pass\n}',
    'merge-k-sorted-lists': 'function mergeKLists(lists) {\n    pass\n}',
    'word-break': 'function wordBreak(s, wordDict) {\n    pass\n}',
    'lru-cache': 'class LRUCache {\n  constructor(capacity) {}\n  get(key) {}\n  put(key, value) {}\n}',
    'trapping-rain-water': 'function trap(height) {\n    pass\n}',
    'n-queens': 'function solveNQueens(n) {\n    pass\n}',
    'median-of-two-sorted-arrays': 'function findMedianSortedArrays(nums1, nums2) {\n    pass\n}',
  },
  cpp: {
    'two-sum': 'vector<int> twoSum(vector<int>& nums, int target) {\n    pass\n}',
    'fibonacci': 'int fibonacci(int n) {\n    pass\n}',
    'valid-parentheses': 'bool isValid(string s) {\n    pass\n}',
    'binary-search': 'int search(vector<int>& nums, int target) {\n    pass\n}',
    'reverse-linked-list': 'ListNode* reverseList(ListNode* head) {\n    pass\n}',
    'valid-palindrome': 'bool isPalindrome(string s) {\n    pass\n}',
    'reverse-string': 'void reverseString(vector<char>& s) {\n    pass\n}',
    'max-subarray': 'int maxSubArray(vector<int>& nums) {\n    pass\n}',
    'contains-duplicate': 'bool containsDuplicate(vector<int>& nums) {\n    pass\n}',
    'bubble-sort': 'void bubbleSort(vector<int>& arr) {\n    pass\n}',
    'climbing-stairs': 'int climbStairs(int n) {\n    pass\n}',
    'best-time-to-buy-and-sell-stock': 'int maxProfit(vector<int>& prices) {\n    pass\n}',
    'longest-common-prefix': 'string longestCommonPrefix(vector<string>& strs) {\n    pass\n}',
    'binary-tree-inorder': 'vector<int> inorderTraversal(TreeNode* root) {\n    pass\n}',
    'validate-bst': 'bool isValidBST(TreeNode* root) {\n    pass\n}',
    'number-of-islands': 'int numIslands(vector<vector<char>>& grid) {\n    pass\n}',
    'course-schedule': 'bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n    pass\n}',
    'merge-k-sorted-lists': 'ListNode* mergeKLists(vector<ListNode*>& lists) {\n    pass\n}',
    'word-break': 'bool wordBreak(string s, vector<string>& wordDict) {\n    pass\n}',
    'lru-cache': 'class LRUCache {\npublic:\n    LRUCache(int capacity) {}\n    int get(int key) {}\n    void put(int key, int value) {}\n};',
    'trapping-rain-water': 'int trap(vector<int>& height) {\n    pass\n}',
    'n-queens': 'vector<vector<string>> solveNQueens(int n) {\n    pass\n}',
    'median-of-two-sorted-arrays': 'double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n    pass\n}',
  },
};

async function fixTemplates() {
  await mongoose.connect('mongodb://127.0.0.1:58036/');
  const Problem = require('./server/models/Problem');
  
  for (const [pid, py] of Object.entries(templates.python)) {
    const js = templates.javascript[pid];
    const cpp = templates.cpp[pid];
    await Problem.updateOne(
      { problemId: pid },
      { $set: { starterCode: { python: py, javascript: js, cpp: cpp } } }
    );
    console.log('Updated ' + pid);
  }
  console.log('Done!');
  process.exit(0);
}

fixTemplates().catch(e => { console.error(e); process.exit(1); });
