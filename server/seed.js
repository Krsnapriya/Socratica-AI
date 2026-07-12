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
    tags: ["array", "hash-map", "searching"],
    estimatedMinutes: 15,
    statement: `Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.

Your solution should be efficient for large inputs.

## Input Format
First line: n (the length of nums)
Second line: n space-separated integers nums[0] ... nums[n-1]
Third line: target

## Output Format
Two space-separated integers representing the indices of the two numbers that sum to target.

## Constraints
- 2 <= n <= 10,000
- -1,000,000,000 <= nums[i] <= 1,000,000,000
- -1,000,000,000 <= target <= 1,000,000,000
- Exactly one valid solution exists.
- O(n) time and O(n) space recommended.

## Examples
Input:
4
2 7 11 15
9
Output: 0 1

Input:
3
3 2 4
6
Output: 1 2

Input:
2
3 3
6
Output: 0 1

## Edge Cases
- Negative numbers and target
- Large values within constraint bounds
- Solution at the start and end of the array`,
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
      { input: "4 -1 -2 -3 -4 -8", expectedOutput: "0 3" },
      { input: "5 1 5 9 12 15 10", expectedOutput: "0 2" },
      { input: "3 100 200 300 500", expectedOutput: "1 2" },
      { input: "2 0 0 0", expectedOutput: "0 1" },
      { input: "6 -5 10 3 7 -2 8 5", expectedOutput: "2 3" },
      { input: "4 1000000000 999999999 1 1999999999", expectedOutput: "0 1" },
      { input: "8 4 1 2 1 2 3 5 6 5", expectedOutput: "0 7" },
    ],
  },

  // ── 2. Reverse Linked List ──────────────────────────────────────────────────
  {
    problemId: "reverse-linked-list",
    title: "Reverse Linked List",
    category: "Linked Lists",
    difficulty: "easy",
    tags: ["linked-list", "recursion", "iteration"],
    estimatedMinutes: 20,
    statement: `Given the head of a singly linked list, reverse the list, and return the reversed list.

The list is provided as space-separated integers. Output the reversed list as space-separated integers.

For an empty list, output nothing.

## Input Format
A single line of space-separated integers representing the linked list values (may be empty).

## Output Format
Space-separated integers of the reversed list. If the input is empty, output nothing.

## Constraints
- 0 <= Number of nodes <= 5,000
- -5,000 <= Node.val <= 5,000
- O(n) time, O(1) extra space recommended (iterative), O(n) for recursive

## Examples
Input: 1 2 3 4 5
Output: 5 4 3 2 1

Input: 1 2
Output: 2 1

Input: 42
Output: 42

Input: (empty)
Output: (empty)

## Edge Cases
- Single node list
- Empty list (no input)
- Two nodes
- Even and odd length lists
- Large values`,
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
      { input: "42", expectedOutput: "42" },
      { input: "", expectedOutput: "" },
      { input: "0", expectedOutput: "0" },
      { input: "-1 -2 -3", expectedOutput: "-3 -2 -1" },
      { input: "5 4 3 2 1", expectedOutput: "1 2 3 4 5" },
      { input: "1 1 1 1", expectedOutput: "1 1 1 1" },
      { input: "-5000 5000", expectedOutput: "5000 -5000" },
      { input: "3 7 0 -4 12", expectedOutput: "12 -4 0 7 3" },
    ],
  },

  // ── 3. Valid Parentheses ────────────────────────────────────────────────────
  {
    problemId: "valid-parentheses",
    title: "Valid Parentheses",
    category: "Stacks",
    difficulty: "easy",
    tags: ["stack", "string", "parsing"],
    estimatedMinutes: 20,
    statement: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

## Input Format
A single line containing the bracket string.

## Output Format
Print "true" if the string is valid, "false" otherwise.

## Constraints
- 1 <= s.length <= 10,000
- s consists of parentheses only '()[]{}'
- O(n) time, O(n) space

## Examples
Input: ()
Output: true

Input: ()[]{}
Output: true

Input: (]
Output: false

Input: ([)]
Output: false

Input: {[]}
Output: true

## Edge Cases
- Single open bracket
- Single close bracket
- Nested deeply
- All same type
- Alternating mismatched`,
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
      { input: "{[]}", expectedOutput: "true" },
      { input: "{", expectedOutput: "false" },
      { input: "}", expectedOutput: "false" },
      { input: "(((((((()", expectedOutput: "false" },
      { input: "((((()))))", expectedOutput: "true" },
      { input: "[({})]", expectedOutput: "true" },
      { input: "[(])", expectedOutput: "false" },
      { input: "", expectedOutput: "true" },
    ],
  },

  // ── 4. Binary Search ────────────────────────────────────────────────────────
  {
    problemId: "binary-search",
    title: "Binary Search",
    category: "Algorithms",
    difficulty: "easy",
    tags: ["binary-search", "array", "searching"],
    estimatedMinutes: 15,
    statement: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

## Input Format
First line: n (array length)
Second line: n space-separated integers (sorted ascending)
Third line: target

## Output Format
A single integer: the index of target if found, or -1.

## Constraints
- 1 <= n <= 10,000
- -10,000 <= nums[i] <= 10,000
- -10,000 <= target <= 10,000
- nums is sorted in strictly increasing order
- O(log n) time, O(1) space

## Examples
Input:
6
-1 0 3 5 9 12
9
Output: 4

Input:
3
1 2 3
4
Output: -1

Input:
1
5
5
Output: 0

## Edge Cases
- Single element (found and not found)
- Target smaller than all elements
- Target larger than all elements
- Duplicates not present (strictly increasing)`,
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
      { input: "1 5 5", expectedOutput: "0" },
      { input: "1 5 3", expectedOutput: "-1" },
      { input: "7 1 3 5 7 9 11 13 1", expectedOutput: "0" },
      { input: "7 1 3 5 7 9 11 13 13", expectedOutput: "6" },
      { input: "7 1 3 5 7 9 11 13 14", expectedOutput: "-1" },
      { input: "7 1 3 5 7 9 11 13 0", expectedOutput: "-1" },
      { input: "10 -20 -15 -10 -5 0 5 10 15 20 25 -15", expectedOutput: "1" },
      { input: "10 -20 -15 -10 -5 0 5 10 15 20 25 25", expectedOutput: "9" },
    ],
  },

  // ── 5. Fibonacci ────────────────────────────────────────────────────────────
  {
    problemId: "fibonacci",
    title: "Fibonacci Number",
    category: "Recursion",
    difficulty: "medium",
    tags: ["recursion", "memoization", "dynamic-programming", "math"],
    estimatedMinutes: 25,
    statement: `The Fibonacci numbers, commonly denoted F(n), form a sequence such that each number is the sum of the two preceding ones, starting from 0 and 1:
F(0) = 0, F(1) = 1
F(n) = F(n - 1) + F(n - 2), for n > 1.

Given n, calculate F(n). Your solution should be efficient for large n values.

## Input Format
A single line containing the integer n.

## Output Format
A single integer: the nth Fibonacci number.

## Constraints
- 0 <= n <= 30
- F(n) fits within a 32-bit signed integer (max F(30) = 832,040)
- O(n) time is expected. O(2^n) recursive without memoization is acceptable for n <= 30 but not ideal.

## Examples
Input: 2
Output: 1

Input: 10
Output: 55

Input: 0
Output: 0

Input: 1
Output: 1

## Edge Cases
- n = 0 (base case)
- n = 1 (base case)
- n = 2 (first sum)
- n = 30 (max constraint)`,
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
      { input: "0", expectedOutput: "0" },
      { input: "1", expectedOutput: "1" },
      { input: "2", expectedOutput: "1" },
      { input: "3", expectedOutput: "2" },
      { input: "4", expectedOutput: "3" },
      { input: "5", expectedOutput: "5" },
      { input: "10", expectedOutput: "55" },
      { input: "15", expectedOutput: "610" },
      { input: "20", expectedOutput: "6765" },
      { input: "30", expectedOutput: "832040" },
    ],
  },

  // ── 6. Valid Palindrome ─────────────────────────────────────────────────────
  {
    problemId: "valid-palindrome",
    title: "Valid Palindrome",
    category: "Strings",
    difficulty: "easy",
    tags: ["string", "two-pointers", "palindrome"],
    estimatedMinutes: 15,
    statement: `Given a string s, return true if it is a palindrome, or false otherwise.

A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

## Input Format
A single line containing the string s.

## Output Format
Print "true" if s is a palindrome, "false" otherwise.

## Constraints
- 1 <= s.length <= 100,000
- s consists of printable ASCII characters.
- O(n) time, O(1) extra space.

## Examples
Input: A man, a plan, a canal: Panama
Output: true

Input: race a car
Output: false

Input:
(empty line)
Output: true

Input: 0P
Output: false

## Edge Cases
- Empty string
- Single character
- Only non-alphanumeric characters
- Mixed case
- Numbers included`,
    starterCode: {
      python: `import sys

def is_palindrome(s):
    # Your solution here
    pass

s = sys.stdin.read().strip()
print("true" if is_palindrome(s) else "false")`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const s = lines.join(' ');

  function isPalindrome(s) {
    // Your solution here
  }

  console.log(isPalindrome(s) ? 'true' : 'false');
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
bool isPalindrome(string s) {
    // Your solution here
    return false;
}
int main() {
    string s;
    getline(cin, s);
    cout << (isPalindrome(s) ? "true" : "false") << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys, re
def is_palindrome(s):
    s = re.sub(r'[^a-zA-Z0-9]', '', s).lower()
    return s == s[::-1]
s = sys.stdin.read().strip()
print("true" if is_palindrome(s) else "false")`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const s = lines.join(' ');
  const clean = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  console.log(clean === clean.split('').reverse().join('') ? 'true' : 'false');
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s, clean;
    getline(cin, s);
    for (char c : s) if (isalnum(c)) clean += tolower(c);
    string rev = clean;
    reverse(rev.begin(), rev.end());
    cout << (clean == rev ? "true" : "false") << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true" },
      { input: "race a car", expectedOutput: "false" },
      { input: " ", expectedOutput: "true" },
      { input: "0P", expectedOutput: "false" },
      { input: "a", expectedOutput: "true" },
      { input: "ab", expectedOutput: "false" },
      { input: ".,", expectedOutput: "true" },
      { input: "Aba", expectedOutput: "true" },
      { input: "Never odd or even", expectedOutput: "true" },
      { input: "12321", expectedOutput: "true" },
      { input: "12345", expectedOutput: "false" },
      { input: "", expectedOutput: "true" },
    ],
  },

  // ── 7. Reverse String ──────────────────────────────────────────────────────
  {
    problemId: "reverse-string",
    title: "Reverse String",
    category: "Strings",
    difficulty: "easy",
    tags: ["string", "two-pointers"],
    estimatedMinutes: 10,
    statement: `Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.

## Input Format
A single line containing the string to reverse.

## Output Format
Print the reversed string.

## Constraints
- 1 <= s.length <= 100,000
- s consists of printable ASCII characters.
- O(n) time, O(1) space required.

## Examples
Input: hello
Output: olleh

Input: H
Output: H

Input: racecar
Output: racecar

## Edge Cases
- Single character
- Palindrome string (same forwards and backwards)
- All same character
- Even and odd length`,
    starterCode: {
      python: `import sys

def reverse_string(s):
    # Your solution here
    pass

s = sys.stdin.read().strip()
print(reverse_string(list(s)))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
  const s = line.trim();

  function reverseString(s) {
    // Your solution here
  }

  console.log(reverseString(s));
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s;
    getline(cin, s);
    // Your solution here: reverse s
    cout << s << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
s = list(sys.stdin.read().strip())
s.reverse()
print(''.join(s))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
  console.log(line.trim().split('').reverse().join(''));
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s;
    getline(cin, s);
    reverse(s.begin(), s.end());
    cout << s << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "hello", expectedOutput: "olleh" },
      { input: "H", expectedOutput: "H" },
      { input: "", expectedOutput: "" },
      { input: "racecar", expectedOutput: "racecar" },
      { input: "123456789", expectedOutput: "987654321" },
      { input: "a b c", expectedOutput: "c b a" },
      { input: "!!@@##", expectedOutput: "##@@!!" },
      { input: "abcdefghijklmnopqrstuvwxyz", expectedOutput: "zyxwvutsrqponmlkjihgfedcba" },
      { input: "   ", expectedOutput: "   " },
    ],
  },

  // ── 8. Maximum Subarray ─────────────────────────────────────────────────────
  {
    problemId: "max-subarray",
    title: "Maximum Subarray",
    category: "Dynamic Programming",
    difficulty: "medium",
    tags: ["dynamic-programming", "array", "kadane"],
    estimatedMinutes: 25,
    statement: `Given an integer array nums, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.

## Input Format
First line: n (array length)
Second line: n space-separated integers

## Output Format
A single integer: the maximum subarray sum.

## Constraints
- 1 <= n <= 100,000
- -10,000 <= nums[i] <= 10,000
- O(n) time, O(1) space expected (Kadane's algorithm).

## Examples
Input:
9
-2 1 -3 4 -1 2 1 -5 4
Output: 6

Explanation: [4,-1,2,1] has the largest sum = 6.

Input:
1
1
Output: 1

Input:
5
5 4 -1 7 8
Output: 23

## Edge Cases
- All negative numbers (return the largest)
- Single element
- All positive
- Alternating signs`,
    starterCode: {
      python: `import sys

def max_subarray(nums):
    # Your solution here
    pass

data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:]))
print(max_subarray(nums))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const nums = parts.slice(1, n + 1);

  function maxSubArray(nums) {
    // Your solution here
  }

  console.log(maxSubArray(nums));
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int maxSubArray(vector<int>& nums) {
    // Your solution here
    return 0;
}
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    cout << maxSubArray(nums) << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
def max_subarray(nums):
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:]))
print(max_subarray(nums))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const nums = parts.slice(1, n + 1);
  let best = nums[0], cur = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  console.log(best);
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    int best = nums[0], cur = nums[0];
    for (int i = 1; i < n; i++) {
        cur = max(nums[i], cur + nums[i]);
        best = max(best, cur);
    }
    cout << best << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "9 -2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6" },
      { input: "1 1", expectedOutput: "1" },
      { input: "5 5 4 -1 7 8", expectedOutput: "23" },
      { input: "1 -1", expectedOutput: "-1" },
      { input: "3 -2 -3 -1", expectedOutput: "-1" },
      { input: "4 1 2 3 4", expectedOutput: "10" },
      { input: "6 -2 1 -3 4 -1 2", expectedOutput: "4" },
      { input: "10 -1 -2 -3 -4 -5 -6 -7 -8 -9 -10", expectedOutput: "-1" },
      { input: "3 0 0 0", expectedOutput: "0" },
      { input: "7 10 -2 -3 5 -1 8 -5", expectedOutput: "17" },
      { input: "1 -10000", expectedOutput: "-10000" },
      { input: "100 10000", expectedOutput: "10000" },
    ],
  },

  // ── 9. Contains Duplicate ───────────────────────────────────────────────────
  {
    problemId: "contains-duplicate",
    title: "Contains Duplicate",
    category: "Arrays",
    difficulty: "easy",
    tags: ["array", "hash-set"],
    estimatedMinutes: 10,
    statement: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.

## Input Format
First line: n (array length)
Second line: n space-separated integers

## Output Format
Print "true" if any duplicate exists, "false" otherwise.

## Constraints
- 1 <= n <= 100,000
- -1,000,000,000 <= nums[i] <= 1,000,000,000
- O(n) time, O(n) space.

## Examples
Input:
4
1 2 3 1
Output: true

Input:
4
1 2 3 4
Output: false

Input:
1
1
Output: false

## Edge Cases
- Single element (no duplicate)
- All duplicates
- Large range of values
- Negative values`,
    starterCode: {
      python: `import sys

def contains_duplicate(nums):
    # Your solution here
    pass

data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:]))
print("true" if contains_duplicate(nums) else "false")`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const nums = parts.slice(1, n + 1);

  function containsDuplicate(nums) {
    // Your solution here
  }

  console.log(containsDuplicate(nums) ? 'true' : 'false');
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
bool containsDuplicate(vector<int>& nums) {
    // Your solution here
    return false;
}
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    cout << (containsDuplicate(nums) ? "true" : "false") << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
def contains_duplicate(nums):
    return len(nums) != len(set(nums))
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:]))
print("true" if contains_duplicate(nums) else "false")`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const nums = parts.slice(1, n + 1);
  console.log(new Set(nums).size !== nums.length ? 'true' : 'false');
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    unordered_set<int> seen;
    for (int x : nums) { if (seen.count(x)) { cout << "true" << endl; return 0; } seen.insert(x); }
    cout << "false" << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "4 1 2 3 1", expectedOutput: "true" },
      { input: "4 1 2 3 4", expectedOutput: "false" },
      { input: "1 1", expectedOutput: "false" },
      { input: "10 1 1 1 1 1 1 1 1 1 1", expectedOutput: "true" },
      { input: "3 -1 -2 -3", expectedOutput: "false" },
      { input: "5 100 200 300 200 400", expectedOutput: "true" },
      { input: "6 0 0 0 0 0 0", expectedOutput: "true" },
      { input: "3 1000000000 -1000000000 0", expectedOutput: "false" },
      { input: "2 42 42", expectedOutput: "true" },
    ],
  },

  // ── 10. Bubble Sort ────────────────────────────────────────────────────────
  {
    problemId: "bubble-sort",
    title: "Bubble Sort",
    category: "Algorithms",
    difficulty: "easy",
    tags: ["sorting", "bubble-sort", "array"],
    estimatedMinutes: 15,
    statement: `Implement bubble sort to sort an array of integers in ascending order.

Bubble sort works by repeatedly stepping through the list, comparing adjacent elements and swapping them if they are in the wrong order.

## Input Format
First line: n (array length)
Second line: n space-separated integers

## Output Format
Print the sorted array as space-separated integers.

## Constraints
- 1 <= n <= 1,000
- -10,000 <= nums[i] <= 10,000
- O(n^2) worst-case time (fine for n <= 1000), O(1) space.

## Examples
Input:
5
64 34 25 12 22
Output: 12 22 25 34 64

Input:
3
3 2 1
Output: 1 2 3

Input:
1
42
Output: 42

## Edge Cases
- Already sorted array
- Reverse sorted array
- Single element
- All equal elements`,
    starterCode: {
      python: `import sys

def bubble_sort(nums):
    # Your solution here
    pass

data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:]))
bubble_sort(nums)
print(*nums)`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const nums = parts.slice(1, n + 1);

  function bubbleSort(nums) {
    // Your solution here
  }

  bubbleSort(nums);
  console.log(nums.join(' '));
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
void bubbleSort(vector<int>& nums) {
    // Your solution here
}
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    bubbleSort(nums);
    for (int i = 0; i < n; i++) { cout << nums[i]; if (i+1<n) cout << " "; }
    cout << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:]))
nums.sort()
print(*nums)`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const nums = parts.slice(1, n + 1);
  nums.sort((a,b) => a-b);
  console.log(nums.join(' '));
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    sort(nums.begin(), nums.end());
    for (int i = 0; i < n; i++) { cout << nums[i]; if (i+1<n) cout << " "; }
    cout << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "5 64 34 25 12 22", expectedOutput: "12 22 25 34 64" },
      { input: "3 3 2 1", expectedOutput: "1 2 3" },
      { input: "1 42", expectedOutput: "42" },
      { input: "5 1 2 3 4 5", expectedOutput: "1 2 3 4 5" },
      { input: "5 5 4 3 2 1", expectedOutput: "1 2 3 4 5" },
      { input: "4 9 9 9 9", expectedOutput: "9 9 9 9" },
      { input: "6 -5 -10 0 3 8 -1", expectedOutput: "-10 -5 -1 0 3 8" },
      { input: "2 100 -100", expectedOutput: "-100 100" },
      { input: "7 0 0 0 -1 -1 5 5", expectedOutput: "-1 -1 0 0 0 5 5" },
    ],
  },

  // ── 11. Climbing Stairs ────────────────────────────────────────────────────
  {
    problemId: "climbing-stairs",
    title: "Climbing Stairs",
    category: "Dynamic Programming",
    difficulty: "easy",
    tags: ["dynamic-programming", "fibonacci", "combinatorics"],
    estimatedMinutes: 20,
    statement: `You are climbing a staircase. It takes n steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

This is essentially the Fibonacci sequence: ways(n) = ways(n-1) + ways(n-2), with ways(1) = 1, ways(2) = 2.

## Input Format
A single line containing the integer n.

## Output Format
A single integer: the number of distinct ways to climb to the top.

## Constraints
- 1 <= n <= 45
- Answer fits within a 32-bit signed integer (max ways(45) = 1,836,311,903)
- O(n) time, O(1) space.

## Examples
Input: 2
Output: 2
Explanation: 1+1 or 2

Input: 3
Output: 3
Explanation: 1+1+1 or 1+2 or 2+1

Input: 5
Output: 8

## Edge Cases
- n = 1 (only one way)
- n = 2 (two ways)
- n = 45 (max constraint)`,
    starterCode: {
      python: `import sys

def climb_stairs(n):
    # Your solution here
    pass

n = int(sys.stdin.read().strip())
print(climb_stairs(n))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
  const n = parseInt(line.trim());

  function climbStairs(n) {
    // Your solution here
  }

  console.log(climbStairs(n));
  rl.close();
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int climbStairs(int n) {
    // Your solution here
    return 0;
}
int main() {
    int n; cin >> n;
    cout << climbStairs(n) << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
def climb_stairs(n):
    if n <= 2: return n
    a, b = 1, 2
    for _ in range(3, n+1):
        a, b = b, a + b
    return b
n = int(sys.stdin.read().strip())
print(climb_stairs(n))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
  const n = parseInt(line.trim());
  if (n <= 2) { console.log(n); return; }
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) { const t = a + b; a = b; b = t; }
  console.log(b);
  rl.close();
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    if (n <= 2) { cout << n << endl; return 0; }
    int a = 1, b = 2;
    for (int i = 3; i <= n; i++) { int t = a + b; a = b; b = t; }
    cout << b << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "1", expectedOutput: "1" },
      { input: "2", expectedOutput: "2" },
      { input: "3", expectedOutput: "3" },
      { input: "4", expectedOutput: "5" },
      { input: "5", expectedOutput: "8" },
      { input: "6", expectedOutput: "13" },
      { input: "10", expectedOutput: "89" },
      { input: "15", expectedOutput: "987" },
      { input: "20", expectedOutput: "10946" },
      { input: "45", expectedOutput: "1836311903" },
    ],
  },

  // ── 12. Best Time to Buy and Sell Stock ─────────────────────────────────────
  {
    problemId: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    category: "Arrays",
    difficulty: "easy",
    tags: ["array", "greedy", "sliding-window"],
    estimatedMinutes: 20,
    statement: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

## Input Format
First line: n (number of days)
Second line: n space-separated integers (prices)

## Output Format
A single integer: the maximum possible profit.

## Constraints
- 1 <= n <= 100,000
- 0 <= prices[i] <= 10,000
- O(n) time, O(1) space.

## Examples
Input:
6
7 1 5 3 6 4
Output: 5
Explanation: Buy at 1 (day 2), sell at 6 (day 5), profit = 5.

Input:
5
7 6 4 3 1
Output: 0
Explanation: No profit possible.

Input:
2
1 2
Output: 1

## Edge Cases
- Decreasing prices (profit = 0)
- Single day (profit = 0)
- Large price swings
- All same price`,
    starterCode: {
      python: `import sys

def max_profit(prices):
    # Your solution here
    pass

data = sys.stdin.read().split()
n = int(data[0])
prices = list(map(int, data[1:]))
print(max_profit(prices))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const prices = parts.slice(1, n + 1);

  function maxProfit(prices) {
    // Your solution here
  }

  console.log(maxProfit(prices));
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int maxProfit(vector<int>& prices) {
    // Your solution here
    return 0;
}
int main() {
    int n; cin >> n;
    vector<int> prices(n);
    for (int& x : prices) cin >> x;
    cout << maxProfit(prices) << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
def max_profit(prices):
    min_price = float('inf')
    best = 0
    for p in prices:
        if p < min_price: min_price = p
        elif p - min_price > best: best = p - min_price
    return best
data = sys.stdin.read().split()
n = int(data[0])
prices = list(map(int, data[1:]))
print(max_profit(prices))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const parts = lines.join(' ').split(' ').map(Number);
  const n = parts[0];
  const prices = parts.slice(1, n + 1);
  let minPrice = Infinity, best = 0;
  for (const p of prices) {
    if (p < minPrice) minPrice = p;
    else if (p - minPrice > best) best = p - minPrice;
  }
  console.log(best);
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> prices(n);
    for (int& x : prices) cin >> x;
    int minPrice = INT_MAX, best = 0;
    for (int p : prices) {
        if (p < minPrice) minPrice = p;
        else if (p - minPrice > best) best = p - minPrice;
    }
    cout << best << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "6 7 1 5 3 6 4", expectedOutput: "5" },
      { input: "5 7 6 4 3 1", expectedOutput: "0" },
      { input: "2 1 2", expectedOutput: "1" },
      { input: "1 5", expectedOutput: "0" },
      { input: "7 2 4 1 11 7 5 3", expectedOutput: "10" },
      { input: "4 3 3 3 3", expectedOutput: "0" },
      { input: "3 1 2 3", expectedOutput: "2" },
      { input: "3 3 2 1", expectedOutput: "0" },
      { input: "10 10000 1 2 3 4 5 6 7 8 9", expectedOutput: "8" },
      { input: "6 9 8 7 6 5 4", expectedOutput: "0" },
      { input: "6 0 0 0 0 0 0", expectedOutput: "0" },
    ],
  },

  // ── 13. Longest Common Prefix ──────────────────────────────────────────────
  {
    problemId: "longest-common-prefix",
    title: "Longest Common Prefix",
    category: "Strings",
    difficulty: "easy",
    tags: ["string", "trie", "prefix"],
    estimatedMinutes: 15,
    statement: `Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string (printed as an empty line).

## Input Format
First line: n (number of strings)
Next n lines: each string

## Output Format
Print the longest common prefix string. If none, print nothing.

## Constraints
- 1 <= n <= 200
- 0 <= each string length <= 200
- Strings consist of lowercase English letters only.
- O(S) time where S is sum of all characters.

## Examples
Input:
3
flower
flow
flight
Output: fl

Input:
3
dog
racecar
car
Output: (empty line)

Input:
1
hello
Output: hello

## Edge Cases
- Single string (prefix is the string itself)
- No common prefix
- All strings identical
- Empty string in the list`,
    starterCode: {
      python: `import sys

def longest_common_prefix(strs):
    # Your solution here
    pass

data = sys.stdin.read().splitlines()
n = int(data[0].strip())
strs = [s.strip() for s in data[1:1+n]]
print(longest_common_prefix(strs), end='')`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const n = parseInt(lines[0]);
  const strs = lines.slice(1, n + 1);

  function longestCommonPrefix(strs) {
    // Your solution here
  }

  console.log(longestCommonPrefix(strs));
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
string longestCommonPrefix(vector<string>& strs) {
    // Your solution here
    return "";
}
int main() {
    int n; cin >> n;
    vector<string> strs(n);
    for (int i = 0; i < n; i++) cin >> strs[i];
    cout << longestCommonPrefix(strs) << endl;
}`,
    },
    oracleSolutions: {
      python: `import sys
def longest_common_prefix(strs):
    if not strs: return ""
    prefix = strs[0]
    for s in strs[1:]:
        while not s.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix: return ""
    return prefix
data = sys.stdin.read().splitlines()
n = int(data[0].strip())
strs = [s.strip() for s in data[1:1+n]]
print(longest_common_prefix(strs), end='')`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const n = parseInt(lines[0]);
  const strs = lines.slice(1, n + 1);
  let prefix = strs[0] || '';
  for (let i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (!prefix) break;
    }
  }
  console.log(prefix);
});`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<string> strs(n);
    for (int i = 0; i < n; i++) cin >> strs[i];
    if (strs.empty()) { cout << endl; return 0; }
    string prefix = strs[0];
    for (int i = 1; i < n; i++) {
        while (strs[i].find(prefix) != 0) {
            prefix.pop_back();
            if (prefix.empty()) break;
        }
    }
    cout << prefix << endl;
}`,
    },
    oracleVerified: { python: true, javascript: true, cpp: true },
    testCases: [
      { input: "3 flower flow flight", expectedOutput: "fl" },
      { input: "3 dog racecar car", expectedOutput: "" },
      { input: "1 hello", expectedOutput: "hello" },
      { input: "3 same same same", expectedOutput: "same" },
      { input: "2 a abc", expectedOutput: "a" },
      { input: "2 abc abcde", expectedOutput: "abc" },
      { input: "3 abcdef abc abcdefg", expectedOutput: "abc" },
      { input: "2  a", expectedOutput: "" },
      { input: "3 abcd abc abc", expectedOutput: "abc" },
      { input: "2 a aa", expectedOutput: "a" },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    let created = 0;
    let skipped = 0;
    for (const p of problems) {
      if (!p.description) p.description = p.statement;
      const existing = await Problem.findOne({ problemId: p.problemId });
      if (existing) {
        await Problem.findOneAndUpdate({ problemId: p.problemId }, p, { new: true });
        skipped++;
      } else {
        await Problem.create(p);
        created++;
      }
    }
    console.log(`[seed] Problems done — ${created} created, ${skipped} updated`);

    let course = await Course.findOne({ title: "Core Computer Science" });
    if (!course) {
      course = await Course.create({
        title: "Core Computer Science",
        description: "Master the fundamental algorithms and data structures required for technical interviews and systems engineering.",
        icon: "school",
        order: 1,
      });
    }

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
          { title: "Valid Parentheses", problemId: "valid-parentheses" },
          { title: "Contains Duplicate", problemId: "contains-duplicate" },
          { title: "Best Time to Buy and Sell Stock", problemId: "best-time-to-buy-and-sell-stock" },
          { title: "Longest Common Prefix", problemId: "longest-common-prefix" },
        ],
      });
    }

    let strModule = await Module.findOne({ title: "Strings & Palindromes" });
    if (!strModule) {
      strModule = await Module.create({
        course: course._id,
        title: "Strings & Palindromes",
        description: "String manipulation techniques, palindrome checking, and character arrays.",
        order: 2,
        topics: [
          { title: "Valid Palindrome", problemId: "valid-palindrome" },
          { title: "Reverse String", problemId: "reverse-string" },
        ],
      });
    }

    let algoModule = await Module.findOne({ title: "Algorithms & Logic" });
    if (!algoModule) {
      algoModule = await Module.create({
        course: course._id,
        title: "Algorithms & Logic",
        description: "Intermediate algorithmic thinking, search techniques, sorting, and dynamic programming.",
        order: 3,
        topics: [
          { title: "Binary Search", problemId: "binary-search" },
          { title: "Bubble Sort", problemId: "bubble-sort" },
          { title: "Maximum Subarray", problemId: "max-subarray" },
        ],
        prerequisites: [dsModule._id],
      });
    }

    let dpModule = await Module.findOne({ title: "Dynamic Programming" });
    if (!dpModule) {
      dpModule = await Module.create({
        course: course._id,
        title: "Dynamic Programming",
        description: "Introduction to dynamic programming with Fibonacci, climbing stairs, and subarray problems.",
        order: 4,
        topics: [
          { title: "Fibonacci Number", problemId: "fibonacci" },
          { title: "Climbing Stairs", problemId: "climbing-stairs" },
        ],
        prerequisites: [strModule._id],
      });
    }

    if (!course.modules || course.modules.length === 0) {
      course.modules = [dsModule._id, strModule._id, algoModule._id, dpModule._id];
      await course.save();
    }

    await seedPermissions();
    console.log(`[seed] Done — ${created} created, ${skipped} updated`);
  } catch (err) {
    console.error("[seed] Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
