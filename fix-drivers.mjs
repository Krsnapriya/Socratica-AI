import mongoose from 'mongoose';
import DriverTemplate from './server/models/DriverTemplate.js';

const functionNames = {
  'two-sum': { python: 'twoSum', javascript: 'twoSum', cpp: 'twoSum' },
  'fibonacci': { python: 'fibonacci', javascript: 'fibonacci', cpp: 'fibonacci' },
  'valid-parentheses': { python: 'isValid', javascript: 'isValid', cpp: 'isValid' },
  'binary-search': { python: 'binary_search', javascript: 'binarySearch', cpp: 'binarySearch' },
  'reverse-linked-list': { python: 'reverseList', javascript: 'reverseList', cpp: 'reverseList' },
  'valid-palindrome': { python: 'isPalindrome', javascript: 'isPalindrome', cpp: 'isPalindrome' },
  'reverse-string': { python: 'reverseString', javascript: 'reverseString', cpp: 'reverseString' },
  'max-subarray': { python: 'maxSubArray', javascript: 'maxSubArray', cpp: 'maxSubArray' },
  'contains-duplicate': { python: 'containsDuplicate', javascript: 'containsDuplicate', cpp: 'containsDuplicate' },
  'bubble-sort': { python: 'bubbleSort', javascript: 'bubbleSort', cpp: 'bubbleSort' },
  'climbing-stairs': { python: 'climbStairs', javascript: 'climbStairs', cpp: 'climbStairs' },
  'best-time-to-buy-and-sell-stock': { python: 'maxProfit', javascript: 'maxProfit', cpp: 'maxProfit' },
  'longest-common-prefix': { python: 'longestCommonPrefix', javascript: 'longestCommonPrefix', cpp: 'longestCommonPrefix' },
  'binary-tree-inorder': { python: 'inorderTraversal', javascript: 'inorderTraversal', cpp: 'inorderTraversal' },
  'validate-bst': { python: 'isValidBST', javascript: 'isValidBST', cpp: 'isValidBST' },
  'number-of-islands': { python: 'numIslands', javascript: 'numIslands', cpp: 'numIslands' },
  'course-schedule': { python: 'canFinish', javascript: 'canFinish', cpp: 'canFinish' },
  'merge-k-sorted-lists': { python: 'mergeKLists', javascript: 'mergeKLists', cpp: 'mergeKLists' },
  'word-break': { python: 'wordBreak', javascript: 'wordBreak', cpp: 'wordBreak' },
  'lru-cache': { python: 'LRUCache', javascript: 'LRUCache', cpp: 'LRUCache' },
  'trapping-rain-water': { python: 'trap', javascript: 'trap', cpp: 'trap' },
  'n-queens': { python: 'solveNQueens', javascript: 'solveNQueens', cpp: 'solveNQueens' },
  'median-of-two-sorted-arrays': { python: 'findMedianSortedArrays', javascript: 'findMedianSortedArrays', cpp: 'findMedianSortedArrays' },
};

async function fixTemplates() {
  await mongoose.connect('mongodb://127.0.0.1:55704/');
  console.log('Connected to MongoDB');
  
  const DriverTemplate = (await import('./server/models/DriverTemplate.js')).default;
  
  const drivers = await DriverTemplate.find({}).lean();
  console.log('Found', drivers.length, 'drivers');
  
  for (const d of drivers) {
    const fix = functionNames[d.problemId];
    if (!fix) continue;
    
    const fn = fix[d.language];
    if (!fn) continue;
    
    await DriverTemplate.findByIdAndUpdate(d._id, { functionName: fn });
    console.log('Fixed', d.problemId, d.language, '->', fn);
  }
  
  console.log('Done!');
  process.exit(0);
}

fixTemplates().catch(e => { console.error(e); process.exit(1); });
