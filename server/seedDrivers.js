// seedDrivers.js — Seeds DriverTemplate for all problems (Python only for now)
// DriverTemplate provides the test harness that wraps student code

const DriverTemplate = require("./models/DriverTemplate");
const Problem = require("./models/Problem");

const PYTHON_DRIVERS = [
  {
    problemId: "two-sum",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [[2,7,11,15], 9], "expected": [0,1]},
        {"input": [[3,2,4], 6], "expected": [1,2]},
        {"input": [[3,3], 6], "expected": [0,1]},
    ]
    results = []
    for tc in test_cases:
        nums, target = tc["input"]
        result = twoSum(nums, target)
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "twoSum"
  },
  {
    problemId: "fibonacci",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [0], "expected": 0},
        {"input": [1], "expected": 1},
        {"input": [2], "expected": 1},
        {"input": [5], "expected": 5},
        {"input": [10], "expected": 55},
    ]
    results = []
    for tc in test_cases:
        result = fibonacci(tc["input"][0])
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "fibonacci"
  },
  {
    problemId: "valid-parentheses",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": ["()"], "expected": true},
        {"input": ["()[]{}"], "expected": true},
        {"input": ["(]"], "expected": false},
        {"input": ["([)]"], "expected": false},
        {"input": ["{[]}"], "expected": true},
    ]
    results = []
    for tc in test_cases:
        result = isValid(tc["input"][0])
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "isValid"
  },
  {
    problemId: "binary-search",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [[-1,0,3,5,9,12], 9], "expected": 4},
        {"input": [[-1,0,3,5,9,12], 2], "expected": -1},
        {"input": [[5], 5], "expected": 0},
    ]
    results = []
    for tc in test_cases:
        nums, target = tc["input"]
        result = search(nums, target)
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "search"
  },
  {
    problemId: "reverse-linked-list",
    language: "python",
    driverCode: `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def _list_to_linked(lst):
    dummy = ListNode(0)
    curr = dummy
    for v in lst:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def _linked_to_list(head):
    res = []
    while head:
        res.append(head.val)
        head = head.next
    return res

def _run_test():
    import json
    test_cases = [
        {"input": [[1,2,3,4,5]], "expected": [5,4,3,2,1]},
        {"input": [[1,2]], "expected": [2,1]},
        {"input": [[]], "expected": []},
    ]
    results = []
    for tc in test_cases:
        head = _list_to_linked(tc["input"][0])
        result = reverseList(head)
        actual = _linked_to_list(result)
        passed = actual == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": actual, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "reverseList"
  },
  {
    problemId: "valid-palindrome",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": ["A man, a plan, a canal: Panama"], "expected": true},
        {"input": ["race a car"], "expected": false},
        {"input": [" "], "expected": true},
    ]
    results = []
    for tc in test_cases:
        result = isPalindrome(tc["input"][0])
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "isPalindrome"
  },
  {
    problemId: "reverse-string",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [["h","e","l","l","o"]], "expected": ["o","l","l","e","h"]},
        {"input": [["H","a","n","n","a","h"]], "expected": ["h","a","n","n","a","H"]},
    ]
    results = []
    for tc in test_cases:
        s = tc["input"][0].copy()
        reverseString(s)
        passed = s == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": s, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "reverseString"
  },
  {
    problemId: "max-subarray",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [[-2,1,-3,4,-1,2,1,-5,4]], "expected": 6},
        {"input": [[1]], "expected": 1},
        {"input": [[5,4,-1,7,8]], "expected": 23},
    ]
    results = []
    for tc in test_cases:
        result = maxSubArray(tc["input"][0])
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "maxSubArray"
  },
  {
    problemId: "contains-duplicate",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [[1,2,3,1]], "expected": true},
        {"input": [[1,2,3,4]], "expected": false},
        {"input": [[1,1,1,3,3,4,3,2,4,2]], "expected": true},
    ]
    results = []
    for tc in test_cases:
        result = containsDuplicate(tc["input"][0])
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "containsDuplicate"
  },
  {
    problemId: "bubble-sort",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [[64,34,25,12,22,11,90]], "expected": [11,12,22,25,34,64,90]},
        {"input": [[5,4,3,2,1]], "expected": [1,2,3,4,5]},
        {"input": [[]], "expected": []},
    ]
    results = []
    for tc in test_cases:
        arr = tc["input"][0].copy()
        bubbleSort(arr)
        passed = arr == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": arr, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "bubbleSort"
  },
  {
    problemId: "climbing-stairs",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [2], "expected": 2},
        {"input": [3], "expected": 3},
        {"input": [5], "expected": 8},
    ]
    results = []
    for tc in test_cases:
        result = climbStairs(tc["input"][0])
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "climbStairs"
  },
  {
    problemId: "best-time-to-buy-and-sell-stock",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [[7,1,5,3,6,4]], "expected": 5},
        {"input": [[7,6,4,3,1]], "expected": 0},
    ]
    results = []
    for tc in test_cases:
        result = maxProfit(tc["input"][0])
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "maxProfit"
  },
  {
    problemId: "longest-common-prefix",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [["flower","flow","flight"]], "expected": "fl"},
        {"input": [["dog","racecar","car"]], "expected": ""},
        {"input": [["a"]], "expected": "a"},
    ]
    results = []
    for tc in test_cases:
        result = longestCommonPrefix(tc["input"][0])
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "longestCommonPrefix"
  },
  // Advanced problems
  {
    problemId: "binary-tree-inorder",
    language: "python",
    driverCode: `
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _list_to_tree(lst):
    if not lst:
        return None
    nodes = [TreeNode(v) if v is not None else None for v in lst]
    kids = nodes[::-1]
    root = kids.pop()
    for node in nodes:
        if node:
            if kids: node.left = kids.pop()
            if kids: node.right = kids.pop()
    return root

def _run_test():
    import json
    test_cases = [
        {"input": [[1,null,2,3]], "expected": [1,3,2]},
        {"input": [[]], "expected": []},
        {"input": [[1]], "expected": [1]},
    ]
    results = []
    for tc in test_cases:
        root = _list_to_tree(tc["input"][0])
        result = inorderTraversal(root)
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "inorderTraversal"
  },
  {
    problemId: "validate-bst",
    language: "python",
    driverCode: `
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _list_to_tree(lst):
    if not lst:
        return None
    nodes = [TreeNode(v) if v is not None else None for v in lst]
    kids = nodes[::-1]
    root = kids.pop()
    for node in nodes:
        if node:
            if kids: node.left = kids.pop()
            if kids: node.right = kids.pop()
    return root

def _run_test():
    import json
    test_cases = [
        {"input": [[2,1,3]], "expected": true},
        {"input": [[5,1,4,null,null,3,6]], "expected": false},
    ]
    results = []
    for tc in test_cases:
        root = _list_to_tree(tc["input"][0])
        result = isValidBST(root)
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "isValidBST"
  },
  {
    problemId: "number-of-islands",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]], "expected": 1},
        {"input": [[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]], "expected": 3},
    ]
    results = []
    for tc in test_cases:
        grid = tc["input"][0]
        result = numIslands(grid)
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "numIslands"
  },
  {
    problemId: "course-schedule",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [2, [[1,0]]], "expected": true},
        {"input": [2, [[1,0],[0,1]]], "expected": false},
    ]
    results = []
    for tc in test_cases:
        numCourses, prerequisites = tc["input"]
        result = canFinish(numCourses, prerequisites)
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "canFinish"
  },
  {
    problemId: "merge-k-sorted-lists",
    language: "python",
    driverCode: `
import heapq

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def _list_to_linked(lst):
    dummy = ListNode(0)
    curr = dummy
    for v in lst:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def _linked_to_list(head):
    res = []
    while head:
        res.append(head.val)
        head = head.next
    return res

def _run_test():
    import json
    test_cases = [
        {"input": [[[1,4,5],[1,3,4],[2,6]]], "expected": [1,1,2,3,4,4,5,6]},
        {"input": [[]], "expected": []},
        {"input": [[[]]], "expected": []},
    ]
    results = []
    for tc in test_cases:
        lists = [_list_to_linked(l) for l in tc["input"][0]]
        result = mergeKLists(lists)
        actual = _linked_to_list(result)
        passed = actual == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": actual, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "mergeKLists"
  },
  {
    problemId: "word-break",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": ["leetcode", ["leet","code"]], "expected": true},
        {"input": ["applepenapple", ["apple","pen"]], "expected": true},
        {"input": ["catsandog", ["cats","dog","sand","and","cat"]], "expected": false},
    ]
    results = []
    for tc in test_cases:
        s, wordDict = tc["input"]
        result = wordBreak(s, wordDict)
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "wordBreak"
  },
  {
    problemId: "lru-cache",
    language: "python",
    driverCode: `
def _run_test():
    import json
    cache = LRUCache(2)
    ops = [
        ("put", [1,1], None),
        ("put", [2,2], None),
        ("get", [1], 1),
        ("put", [3,3], None),
        ("get", [2], -1),
        ("put", [4,4], None),
        ("get", [1], -1),
        ("get", [3], 3),
        ("get", [4], 4),
    ]
    results = []
    for op, args, expected in ops:
        if op == "put":
            getattr(cache, op)(*args)
            results.append({"input": [op, args], "expected": expected, "actual": None, "passed": true})
        else:
            actual = getattr(cache, op)(*args)
            passed = actual == expected
            results.append({"input": [op, args], "expected": expected, "actual": actual, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "LRUCache"
  },
  {
    problemId: "trapping-rain-water",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [[0,1,0,2,1,0,1,3,2,1,2,1]], "expected": 6},
        {"input": [[4,2,0,3,2,5]], "expected": 9},
    ]
    results = []
    for tc in test_cases:
        result = trap(tc["input"][0])
        passed = result == tc["expected"]
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "trap"
  },
  {
    problemId: "n-queens",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [4], "expected_count": 2},
        {"input": [1], "expected_count": 1},
    ]
    results = []
    for tc in test_cases:
        result = solveNQueens(tc["input"][0])
        passed = len(result) == tc["expected_count"]
        results.append({"input": tc["input"], "expected_count": tc["expected_count"], "actual_count": len(result), "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "solveNQueens"
  },
  {
    problemId: "median-of-two-sorted-arrays",
    language: "python",
    driverCode: `
def _run_test():
    import json
    test_cases = [
        {"input": [[1,3], [2]], "expected": 2.0},
        {"input": [[1,2], [3,4]], "expected": 2.5},
        {"input": [[0,0], [0,0]], "expected": 0.0},
    ]
    results = []
    for tc in test_cases:
        nums1, nums2 = tc["input"]
        result = findMedianSortedArrays(nums1, nums2)
        passed = abs(result - tc["expected"]) < 1e-5
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": result, "passed": passed})
    print(json.dumps(results))

if __name__ == "__main__":
    _run_test()
`,
    wrapperType: "function_call",
    functionName: "findMedianSortedArrays"
  },
];

async function seedDrivers() {
  await require("mongoose").connect(process.env.MONGO_URI || "mongodb://localhost:27017/socratica");
  console.log("[seedDrivers] Connected to MongoDB");

  let created = 0;
  for (const d of PYTHON_DRIVERS) {
    const exists = await DriverTemplate.findOne({ problemId: d.problemId, language: d.language });
    if (!exists) {
      await DriverTemplate.create(d);
      created++;
      console.log(`  Created driver: ${d.problemId}/${d.language}`);
    }
  }

  console.log(`[seedDrivers] Created ${created} drivers`);
  process.exit(0);
}

if (require.main === module) {
  seedDrivers().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { PYTHON_DRIVERS, seedDrivers };