const ALGORITHM_STRATEGIES = {
  "two-sum": {
    hash_map: { name: "Hash Map", complexity: "O(n)", space: "O(n)", description: "Uses hash map for O(1) lookup" },
    brute_force: { name: "Brute Force", complexity: "O(n²)", space: "O(1)", description: "Checks all pairs" },
    two_pointer: { name: "Two Pointer (sorted)", complexity: "O(n log n)", space: "O(n)", description: "Sort then scan from both ends" },
  },
  "fibonacci": {
    memoization: { name: "Memoization", complexity: "O(n)", space: "O(n)", description: "Top-down with cache" },
    tabulation: { name: "Tabulation", complexity: "O(n)", space: "O(n)", description: "Bottom-up DP table" },
    iterative: { name: "Iterative", complexity: "O(n)", space: "O(1)", description: "Two variables, no array" },
    matrix_exponent: { name: "Matrix Exponentiation", complexity: "O(log n)", space: "O(1)", description: "Fast doubling" },
    recursive: { name: "Recursive", complexity: "O(2^n)", space: "O(n)", description: "Naive recursion" },
  },
  "valid-parentheses": {
    stack: { name: "Stack", complexity: "O(n)", space: "O(n)", description: "Push/pop matching pairs" },
    counter: { name: "Counter", complexity: "O(n)", space: "O(1)", description: "Count balance (only for simple cases)" },
  },
  "binary-search": {
    iterative: { name: "Iterative Binary Search", complexity: "O(log n)", space: "O(1)", description: "Standard binary search" },
    recursive: { name: "Recursive Binary Search", complexity: "O(log n)", space: "O(log n)", description: "Recursive with stack" },
    builtin: { name: "Built-in", complexity: "O(log n)", space: "O(1)", description: "Language built-in search" },
  },
  "reverse-linked-list": {
    iterative: { name: "Iterative", complexity: "O(n)", space: "O(1)", description: "Three pointers" },
    recursive: { name: "Recursive", complexity: "O(n)", space: "O(n)", description: "Recursive reversal" },
  },
  "valid-palindrome": {
    two_pointer: { name: "Two Pointer", complexity: "O(n)", space: "O(1)", description: "Scan from both ends" },
    reverse_compare: { name: "Reverse and Compare", complexity: "O(n)", space: "O(n)", description: "Reverse string, compare" },
  },
  "reverse-string": {
    two_pointer: { name: "Two Pointer", complexity: "O(n)", space: "O(1)", description: "Swap from both ends" },
    builtin: { name: "Built-in Reverse", complexity: "O(n)", space: "O(n)", description: "Language reverse" },
    stack: { name: "Stack-based", complexity: "O(n)", space: "O(n)", description: "Push all, pop all" },
  },
  "max-subarray": {
    kadane: { name: "Kadane's Algorithm", complexity: "O(n)", space: "O(1)", description: "Dynamic programming" },
    divide_conquer: { name: "Divide and Conquer", complexity: "O(n log n)", space: "O(log n)", description: "Recursive split" },
    brute_force: { name: "Brute Force", complexity: "O(n²)", space: "O(1)", description: "Check all subarrays" },
  },
  "contains-duplicate": {
    hash_set: { name: "Hash Set", complexity: "O(n)", space: "O(n)", description: "Track seen elements" },
    sort: { name: "Sorting", complexity: "O(n log n)", space: "O(1)", description: "Sort then scan adjacent" },
    brute_force: { name: "Brute Force", complexity: "O(n²)", space: "O(1)", description: "Check all pairs" },
  },
  "bubble-sort": {
    optimized: { name: "Optimized Bubble Sort", complexity: "O(n²) avg, O(n) best", space: "O(1)", description: "Early termination" },
    basic: { name: "Basic Bubble Sort", complexity: "O(n²)", space: "O(1)", description: "Standard implementation" },
  },
  "climbing-stairs": {
    dp: { name: "Dynamic Programming", complexity: "O(n)", space: "O(1)", description: "Two variables" },
    memo: { name: "Memoized Recursion", complexity: "O(n)", space: "O(n)", description: "Top-down" },
    fibonacci: { name: "Fibonacci Formula", complexity: "O(1)", space: "O(1)", description: "Direct formula" },
  },
  "best-time-to-buy-and-sell-stock": {
    single_pass: { name: "Single Pass", complexity: "O(n)", space: "O(1)", description: "Track min price" },
    dp: { name: "DP", complexity: "O(n)", space: "O(n)", description: "DP array" },
  },
  "longest-common-prefix": {
    horizontal: { name: "Horizontal Scanning", complexity: "O(S)", space: "O(1)", description: "Compare character by character" },
    vertical: { name: "Vertical Scanning", complexity: "O(S)", space: "O(1)", description: "Compare column by column" },
    sorting: { name: "Sorting", complexity: "O(n log n)", space: "O(1)", description: "Sort, compare first and last" },
    trie: { name: "Trie", complexity: "O(S)", space: "O(S)", description: "Build trie, find common path" },
  },
};

function detectAlgorithmStrategy(code, language, problemId) {
  const strategies = ALGORITHM_STRATEGIES[problemId] || {};
  const detected = [];
  const lowerCode = code.toLowerCase();

  for (const [key, strategy] of Object.entries(strategies)) {
    let match = false;
    switch (key) {
      case "hash_map":
        match = /dict\(|HashMap|Map\(\)|{}/.test(code) && !code.includes("sort");
        break;
      case "brute_force":
        match = /for\s.*for\s|while.*while/.test(code) && !code.includes("sort");
        break;
      case "two_pointer":
        match = /left.*right|start.*end|low.*high/.test(code) || /while\s+.*<\s*=.*>/.test(code);
        break;
      case "stack":
        match = /push|append|\.add\(|stack|\.pop\(\)/.test(code);
        break;
      case "counter":
        match = /count\s*[+\-=]|counter|freq/.test(code) && !code.includes("dict") && !code.includes("Map");
        break;
      case "iterative":
        match = /for\s|while\s/.test(code) && !code.match(/def\s+\w+.*\n.*\w+\(/);
        break;
      case "recursive":
        match = /\bdef\s+(\w+).*\n.*\1\(|function\s+(\w+).*\n.*\1\(/.test(code);
        break;
      case "memoization":
      case "memo":
        match = /@lru_cache|@cache|memo|memoize|dp\s*\[/.test(code) && /\bdef\s+(\w+).*\n.*\1\(/.test(code);
        break;
      case "dp":
      case "tabulation":
        match = /dp\s*=\s*\[|dp\s*=\s*Array|dp\s*=\s*\{/.test(code);
        break;
      case "kadane":
        match = /max_so_far|max_ending_here|current_max|best_sum/.test(code);
        break;
      case "hash_set":
      case "set":
        match = /set\(|Set\(\)|seen\.|visited/.test(code);
        break;
      case "sort":
        match = /sort\(|\.sort\(|sorted\(/.test(code);
        break;
      case "divide_conquer":
        match = /mid|left.*right.*mid|split/.test(code) && /\bdef\s+(\w+).*\n.*\1\(/.test(code);
        break;
      case "single_pass":
        match = /min_price|minimum|min_so_far/.test(code) || /for.*price/.test(code);
        break;
      case "trie":
        match = /trie|Trie|node.*children/.test(code);
        break;
      default:
        match = lowerCode.includes(key.replace("_", " "));
    }
    if (match) detected.push({ ...strategy, key });
  }

  return detected;
}

function compareSolutions(studentCode, oracleCode, problemId, language) {
  const studentStrategies = detectAlgorithmStrategy(studentCode, language, problemId);
  const oracleStrategies = detectAlgorithmStrategy(oracleCode, language, problemId);

  const primaryStudent = studentStrategies[0] || { name: "Unknown", complexity: "Unknown", space: "Unknown" };
  const primaryOracle = oracleStrategies[0] || { name: "Unknown", complexity: "Unknown", space: "Unknown" };

  const complexityRank = { "O(1)": 1, "O(log n)": 2, "O(n)": 3, "O(n log n)": 4, "O(n²)": 5, "O(n³)": 6, "O(2^n)": 7 };

  const studentRank = complexityRank[primaryStudent.complexity] || 5;
  const oracleRank = complexityRank[primaryOracle.complexity] || 5;

  let comparison;
  if (studentRank < oracleRank) {
    comparison = "Your solution is more time-efficient than the reference implementation.";
  } else if (studentRank > oracleRank) {
    comparison = "The reference solution is more time-efficient, but your solution may have other advantages.";
  } else {
    comparison = "Both solutions have equivalent time complexity.";
  }

  return {
    student: {
      strategy: primaryStudent.name,
      complexity: primaryStudent.complexity,
      space: primaryStudent.space,
      allStrategies: studentStrategies,
    },
    oracle: {
      strategy: primaryOracle.name,
      complexity: primaryOracle.complexity,
      space: primaryOracle.space,
      allStrategies: oracleStrategies,
    },
    comparison,
    areEquivalent: studentRank <= oracleRank + 1,
    studentAdvantages: [],
    oracleAdvantages: [],
  };
}

module.exports = { compareSolutions, detectAlgorithmStrategy, ALGORITHM_STRATEGIES };
