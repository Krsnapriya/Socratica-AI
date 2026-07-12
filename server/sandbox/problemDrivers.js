/**
 * Socratica AI — Problem Test Drivers
 * Injects validation/drivers to execute student code and compare against oracle.
 */

const PROBLEM_DRIVERS = {
  "two-sum": {
    python: `\nprint(two_sum([2,7,11,15], 9))\nprint(two_sum([3,2,4], 6))\nprint(two_sum([3,3], 6))\n`,
    javascript: `\nconsole.log(twoSum([2,7,11,15],9).join(','));\nconsole.log(twoSum([3,2,4],6).join(','));\nconsole.log(twoSum([3,3],6).join(','));\n`,
    cpp: `\nint main() {\n  int a[]={2,7,11,15}; std::vector<int> va(a,a+4); auto r=twoSum(va,9); std::cout<<r[0]<<","<<r[1]<<"\\n";\n  int b[]={3,2,4}; std::vector<int> vb(b,b+3); r=twoSum(vb,6); std::cout<<r[0]<<","<<r[1]<<"\\n";\n  int c[]={3,3}; std::vector<int> vc(c,c+2); r=twoSum(vc,6); std::cout<<r[0]<<","<<r[1]<<"\\n";\n}\n`,
  },
  "fibonacci": {
    python: `\nprint(fib(0))\nprint(fib(1))\nprint(fib(10))\n`,
    javascript: `\nconsole.log(fib(0));\nconsole.log(fib(1));\nconsole.log(fib(10));\n`,
    cpp: `\nint main() { std::cout<<fib(0)<<"\\n"<<fib(1)<<"\\n"<<fib(10)<<"\\n"; }\n`,
  },
  "palindrome": {
    python: `\nprint(is_palindrome("A man, a plan, a canal: Panama"))\nprint(is_palindrome("race a car"))\nprint(is_palindrome(" "))\n`,
    javascript: `\nconsole.log(isPalindrome("A man, a plan, a canal: Panama"));\nconsole.log(isPalindrome("race a car"));\nconsole.log(isPalindrome(" "));\n`,
    cpp: `\nint main() { std::cout<<isPalindrome("A man, a plan, a canal: Panama")<<"\\n"<<isPalindrome("race a car")<<"\\n"<<isPalindrome(" ")<<"\\n"; }\n`,
  },
  "reverse-string": {
    python: `\nprint(reverse_string("hello"))\nprint(reverse_string("Hannah"))\nprint(reverse_string(""))\n`,
    javascript: `\nconsole.log(reverseString("hello"));\nconsole.log(reverseString("Hannah"));\nconsole.log(reverseString(""));\n`,
    cpp: `\nint main() { std::cout<<reverseString("hello")<<"\\n"<<reverseString("Hannah")<<"\\n"<<reverseString("")<<"\\n"; }\n`,
  },
  "max-subarray": {
    python: `\nprint(max_subarray([-2,1,-3,4,-1,2,1,-5,4]))\nprint(max_subarray([1]))\nprint(max_subarray([5,4,-1,7,8]))\n`,
    javascript: `\nconsole.log(maxSubarray([-2,1,-3,4,-1,2,1,-5,4]));\nconsole.log(maxSubarray([1]));\nconsole.log(maxSubarray([5,4,-1,7,8]));\n`,
    cpp: `\nint main() { std::vector<int> a={-2,1,-3,4,-1,2,1,-5,4}; std::cout<<maxSubarray(a)<<"\\n"; std::vector<int> b={1}; std::cout<<maxSubarray(b)<<"\\n"; std::vector<int> c={5,4,-1,7,8}; std::cout<<maxSubarray(c)<<"\\n"; }\n`,
  },
  "contains-duplicate": {
    python: `\nprint(contains_duplicate([1,2,3,1]))\nprint(contains_duplicate([1,2,3,4]))\nprint(contains_duplicate([1,1,1,3,3,4,3,2,4,2]))\n`,
    javascript: `\nconsole.log(containsDuplicate([1,2,3,1]));\nconsole.log(containsDuplicate([1,2,3,4]));\nconsole.log(containsDuplicate([1,1,1,3,3,4,3,2,4,2]));\n`,
    cpp: `\nint main() { std::vector<int> a={1,2,3,1}; std::cout<<containsDuplicate(a)<<"\\n"; std::vector<int> b={1,2,3,4}; std::cout<<containsDuplicate(b)<<"\\n"; std::vector<int> c={1,1,1,3,3,4,3,2,4,2}; std::cout<<containsDuplicate(c)<<"\\n"; }\n`,
  },
  "bubble-sort": {
    python: `\nprint(bubble_sort([64,34,25,12,22,11,90]))\nprint(bubble_sort([5,1,4,2,8]))\nprint(bubble_sort([1]))\n`,
    javascript: `\nconsole.log(bubbleSort([64,34,25,12,22,11,90]).join(','));\nconsole.log(bubbleSort([5,1,4,2,8]).join(','));\nconsole.log(bubbleSort([1]).join(','));\n`,
    cpp: `\nint main() { for(auto v: bubbleSort({64,34,25,12,22,11,90})) std::cout<<v<<" "; std::cout<<"\\n"; for(auto v: bubbleSort({5,1,4,2,8})) std::cout<<v<<" "; std::cout<<"\\n"; for(auto v: bubbleSort({1})) std::cout<<v<<" "; std::cout<<"\\n"; }\n`,
  },
  "binary-search": {
    python: `\nprint(binary_search([-1,0,3,5,9,12], 9))\nprint(binary_search([-1,0,3,5,9,12], 2))\nprint(binary_search([5], 5))\n`,
    javascript: `\nconsole.log(binarySearch([-1,0,3,5,9,12], 9));\nconsole.log(binarySearch([-1,0,3,5,9,12], 2));\nconsole.log(binarySearch([5], 5));\n`,
    cpp: `\nint main() { std::vector<int> a={-1,0,3,5,9,12}; std::cout<<binarySearch(a,9)<<"\\n"<<binarySearch(a,2)<<"\\n"; std::vector<int> b={5}; std::cout<<binarySearch(b,5)<<"\\n"; }\n`,
  },
  "valid-parentheses": {
    python: `\nprint(is_valid("()"))\nprint(is_valid("()[]{}"))\nprint(is_valid("(]"))\n`,
    javascript: `\nconsole.log(isValid("()"));\nconsole.log(isValid("()[]{}"));\nconsole.log(isValid("(]"));\n`,
    cpp: `\nint main() { std::cout<<isValid("()")<<"\\n"<<isValid("()[]{}")<<"\\n"<<isValid("(]")<<"\\n"; }\n`,
  },
  "climbing-stairs": {
    python: `\nprint(climb_stairs(2))\nprint(climb_stairs(3))\nprint(climb_stairs(5))\n`,
    javascript: `\nconsole.log(climbStairs(2));\nconsole.log(climbStairs(3));\nconsole.log(climbStairs(5));\n`,
    cpp: `\nint main() { std::cout<<climbStairs(2)<<"\\n"<<climbStairs(3)<<"\\n"<<climbStairs(5)<<"\\n"; }\n`,
  },
  "best-time-to-buy-and-sell-stock": {
    python: `\nprint(max_profit([7,1,5,3,6,4]))\nprint(max_profit([7,6,4,3,1]))\nprint(max_profit([1,2]))\n`,
    javascript: `\nconsole.log(maxProfit([7,1,5,3,6,4]));\nconsole.log(maxProfit([7,6,4,3,1]));\nconsole.log(maxProfit([1,2]));\n`,
    cpp: `\nint main() { std::vector<int> a={7,1,5,3,6,4}; std::cout<<maxProfit(a)<<"\\n"; std::vector<int> b={7,6,4,3,1}; std::cout<<maxProfit(b)<<"\\n"; std::vector<int> c={1,2}; std::cout<<maxProfit(c)<<"\\n"; }\n`,
  },
  "longest-common-prefix": {
    python: `\nprint(longest_common_prefix(["flower", "flow", "flight"]))\nprint(longest_common_prefix(["dog", "racecar", "car"]))\nprint(longest_common_prefix(["interspecies", "interstellar", "interstate"]))\n`,
    javascript: `\nconsole.log(longestCommonPrefix(["flower", "flow", "flight"]));\nconsole.log(longestCommonPrefix(["dog", "racecar", "car"]));\nconsole.log(longestCommonPrefix(["interspecies", "interstellar", "interstate"]));\n`,
    cpp: `\nint main() { std::vector<std::string> a={"flower","flow","flight"}; std::cout<<longestCommonPrefix(a)<<"\\n"; std::vector<std::string> b={"dog","racecar","car"}; std::cout<<longestCommonPrefix(b)<<"\\n"; std::vector<std::string> c={"interspecies","interstellar","interstate"}; std::cout<<longestCommonPrefix(c)<<"\\n"; }\n`,
  },
};

function injectDriver(code, problemId, language) {
  const drivers = PROBLEM_DRIVERS[problemId];
  if (!drivers) return code;
  const driver = drivers[language] || "";
  if (!driver) return code;

  if (language === "cpp") {
    return "#include <iostream>\n" + code + driver;
  }

  // Don't inject if student already has calls (heuristic)
  if (language === "python" && code.includes("print(") && code.length > 100) {
    return code;
  }
  return code + driver;
}

module.exports = { injectDriver, PROBLEM_DRIVERS };
