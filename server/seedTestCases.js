require("dotenv").config();
const mongoose = require("mongoose");
const TestCase = require("./models/TestCase");
const DriverTemplate = require("./models/DriverTemplate");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

const TEST_CASES = {
  "two-sum": {
    python: {
      driver: `r = two_sum([2,7,11,15], 9); print(r[0], r[1])
r = two_sum([3,2,4], 6); print(r[0], r[1])
r = two_sum([3,3], 6); print(r[0], r[1])`,
      wrapperType: "function_call",
      functionName: "two_sum",
      samples: [
        { input: "[2,7,11,15], target=9", expectedOutput: "0 1\n1 0\n1 1", description: "Basic cases" },
      ],
      hidden: [
        { input: "[-1,-2,-3,-4,-5], target=-8", expectedOutput: "2 4", category: "edge" },
        { input: "[0,4,3,0], target=0", expectedOutput: "0 3\n3 0", category: "edge" },
        { input: "[3,3], target=6", expectedOutput: "0 1", category: "boundary" },
      ],
    },
    javascript: {
      driver: `let r = twoSum([2,7,11,15], 9); console.log(r[0], r[1]);
r = twoSum([3,2,4], 6); console.log(r[0], r[1]);
r = twoSum([3,3], 6); console.log(r[0], r[1]);`,
      wrapperType: "function_call",
      functionName: "twoSum",
      samples: [
        { input: "[2,7,11,15], target=9", expectedOutput: "0 1\n1 0\n1 1", description: "Basic cases" },
      ],
      hidden: [
        { input: "[-1,-2,-3,-4,-5], target=-8", expectedOutput: "2 4", category: "edge" },
      ],
    },
    cpp: {
      driver: `vector<int> a={2,7,11,15}; auto r=twoSum(a,9); cout<<r[0]<<" "<<r[1]<<endl;
vector<int> b={3,2,4}; r=twoSum(b,6); cout<<r[0]<<" "<<r[1]<<endl;
vector<int> c={3,3}; r=twoSum(c,6); cout<<r[0]<<" "<<r[1]<<endl;`,
      wrapperType: "function_call",
      functionName: "twoSum",
      samples: [
        { input: "[2,7,11,15], target=9", expectedOutput: "0 1\n1 0\n1 1", description: "Basic cases" },
      ],
      hidden: [
        { input: "[-1,-2,-3,-4,-5], target=-8", expectedOutput: "2 4", category: "edge" },
      ],
    },
  },
  "fibonacci": {
    python: {
      driver: `for n in [0,1,2,3,4,5,10,15,20,30]: print(fib(n))`,
      wrapperType: "function_call",
      functionName: "fib",
      samples: [
        { input: "n=0", expectedOutput: "0\n1\n1\n2\n3\n5\n55\n610\n6765\n832040", description: "Fibonacci sequence" },
      ],
      hidden: [
        { input: "n=50", expectedOutput: "12586269025", category: "stress" },
      ],
    },
    javascript: {
      driver: `[0,1,2,3,4,5,10,15,20,30].forEach(n => console.log(fib(n)));`,
      wrapperType: "function_call",
      functionName: "fib",
      samples: [
        { input: "n=0", expectedOutput: "0\n1\n1\n2\n3\n5\n55\n610\n6765\n832040", description: "Fibonacci sequence" },
      ],
      hidden: [],
    },
    cpp: {
      driver: `for(int n:{0,1,2,3,4,5,10,15,20,30}) cout<<fib(n)<<endl;`,
      wrapperType: "function_call",
      functionName: "fib",
      samples: [
        { input: "n=0", expectedOutput: "0\n1\n1\n2\n3\n5\n55\n610\n6765\n832040", description: "Fibonacci sequence" },
      ],
      hidden: [],
    },
  },
  "valid-parentheses": {
    python: {
      driver: `for s in ["()","()[]{}","(]","([)]","{[]}", "{","}","(((((((()","(((())))","[({})]","[(])",""]:
    print("true" if is_valid(s) else "false")`,
      wrapperType: "function_call",
      functionName: "is_valid",
      samples: [
        { input: "()", expectedOutput: "true", description: "Simple valid" },
        { input: "(]", expectedOutput: "false", description: "Simple invalid" },
      ],
      hidden: [
        { input: "empty string", expectedOutput: "true", category: "edge" },
        { input: "((((((", expectedOutput: "false", category: "boundary" },
      ],
    },
    javascript: {
      driver: `["()","()[]{}","(]","([)]","{[]}", "{","}","(((((((()","(((())))","[({})]","[(])", ""].forEach(s => console.log(isValid(s) ? 'true' : 'false'));`,
      wrapperType: "function_call",
      functionName: "isValid",
      samples: [{ input: "()", expectedOutput: "true", description: "Simple valid" }],
      hidden: [],
    },
    cpp: {
      driver: `vector<string> tests = {"()","()[]{}","(]","([)]","{[]}", "{","}","(((((((()","(((())))","[({})]","[(])"};
for (auto& t : tests) cout << (isValid(t)?"true":"false") << endl;`,
      wrapperType: "function_call",
      functionName: "isValid",
      samples: [{ input: "()", expectedOutput: "true", description: "Simple valid" }],
      hidden: [],
    },
  },
  "binary-search": {
    python: {
      driver: `print(binary_search([-1,0,3,5,9,12], 9))
print(binary_search([-1,0,3,5,9,12], 2))
print(binary_search([5], 5))`,
      wrapperType: "function_call",
      functionName: "binary_search",
      samples: [
        { input: "[-1,0,3,5,9,12], target=9", expectedOutput: "4\n-1\n0", description: "Basic binary search" },
      ],
      hidden: [
        { input: "[], target=1", expectedOutput: "-1", category: "edge" },
        { input: "[1], target=1", expectedOutput: "0", category: "boundary" },
      ],
    },
    javascript: {
      driver: `console.log(binarySearch([-1,0,3,5,9,12], 9));
console.log(binarySearch([-1,0,3,5,9,12], 2));
console.log(binarySearch([5], 5));`,
      wrapperType: "function_call",
      functionName: "binarySearch",
      samples: [{ input: "[-1,0,3,5,9,12], target=9", expectedOutput: "4\n-1\n0", description: "Basic" }],
      hidden: [],
    },
    cpp: {
      driver: `vector<int> a={-1,0,3,5,9,12};
cout<<binarySearch(a,9)<<endl;
cout<<binarySearch(a,2)<<endl;
vector<int> b={5};
cout<<binarySearch(b,5)<<endl;`,
      wrapperType: "function_call",
      functionName: "binarySearch",
      samples: [{ input: "[-1,0,3,5,9,12], target=9", expectedOutput: "4\n-1\n0", description: "Basic" }],
      hidden: [],
    },
  },
  "reverse-linked-list": {
    python: {
      driver: `for vals in [[1,2,3,4,5],[1,2],[42],[],[0],[-1,-2,-3],[5,4,3,2,1],[1,1,1,1],[-5000,5000],[3,7,0,-4,12]]:
    r = reverse_list(vals)
    print(*r)`,
      wrapperType: "function_call",
      functionName: "reverse_list",
      samples: [
        { input: "[1,2,3,4,5]", expectedOutput: "5 4 3 2 1", description: "Basic reversal" },
        { input: "[]", expectedOutput: "null", description: "Empty list" },
      ],
      hidden: [
        { input: "[1]", expectedOutput: "1", category: "boundary" },
      ],
    },
    javascript: {
      driver: `[[1,2,3,4,5],[1,2],[42],[],[0],[-1,-2,-3],[5,4,3,2,1],[1,1,1,1],[-5000,5000],[3,7,0,-4,12]].forEach(a => console.log(reverseList(a).join(' ')));`,
      wrapperType: "function_call",
      functionName: "reverseList",
      samples: [{ input: "[1,2,3,4,5]", expectedOutput: "5 4 3 2 1", description: "Basic" }],
      hidden: [],
    },
    cpp: {
      driver: `vector<vector<int>> tests = {{1,2,3,4,5},{1,2},{42},{},{0},{-1,-2,-3},{5,4,3,2,1},{1,1,1,1},{-5000,5000},{3,7,0,-4,12}};
for (auto& v : tests) {
    auto r = reverseList(v);
    for (int i=0;i<(int)r.size();i++){if(i)cout<<" ";cout<<r[i];}
    cout<<endl;
}`,
      wrapperType: "function_call",
      functionName: "reverseList",
      samples: [{ input: "[1,2,3,4,5]", expectedOutput: "5 4 3 2 1", description: "Basic" }],
      hidden: [],
    },
  },
  "valid-palindrome": {
    python: {
      driver: `for s in ["A man, a plan, a canal: Panama","race a car"," ","0P","a","ab",".,","Aba","Never odd or even","12321","12345",""]:
    print("true" if is_palindrome(s) else "false")`,
      wrapperType: "function_call",
      functionName: "is_palindrome",
      samples: [
        { input: "A man, a plan, a canal: Panama", expectedOutput: "true", description: "Classic palindrome" },
        { input: "race a car", expectedOutput: "false", description: "Not a palindrome" },
      ],
      hidden: [{ input: "empty string", expectedOutput: "true", category: "edge" }],
    },
    javascript: {
      driver: `["A man, a plan, a canal: Panama","race a car"," ","0P","a","ab",".,","Aba","Never odd or even","12321","12345", ""].forEach(s => console.log(isPalindrome(s) ? 'true' : 'false'));`,
      wrapperType: "function_call",
      functionName: "isPalindrome",
      samples: [{ input: "A man, a plan, a canal: Panama", expectedOutput: "true", description: "Classic" }],
      hidden: [],
    },
    cpp: {
      driver: `vector<string> tests = {"A man, a plan, a canal: Panama","race a car"," ","0P","a","ab",".,","Aba","Never odd or even","12321","12345"};
for (auto& t : tests) cout << (isPalindrome(t)?"true":"false") << endl;`,
      wrapperType: "function_call",
      functionName: "isPalindrome",
      samples: [{ input: "A man, a plan, a canal: Panama", expectedOutput: "true", description: "Classic" }],
      hidden: [],
    },
  },
  "reverse-string": {
    python: {
      driver: `for s in ["hello","Hannah","","123456789","a b c","!!@@##","abcdefghijklmnopqrstuvwxyz","   "]:
    print(reverse_string(s))`,
      wrapperType: "function_call",
      functionName: "reverse_string",
      samples: [{ input: "hello", expectedOutput: "olleh", description: "Basic" }],
      hidden: [{ input: "empty string", expectedOutput: "empty string", category: "edge" }],
    },
    javascript: {
      driver: `["hello","Hannah","","123456789","a b c","!!@@##","abcdefghijklmnopqrstuvwxyz","   "].forEach(s => console.log(reverseString(s)));`,
      wrapperType: "function_call",
      functionName: "reverseString",
      samples: [{ input: "hello", expectedOutput: "olleh", description: "Basic" }],
      hidden: [],
    },
    cpp: {
      driver: `vector<string> tests = {"hello","Hannah","","123456789","a b c","!!@@##","abcdefghijklmnopqrstuvwxyz","   "};
for (auto& t : tests) cout << reverseString(t) << endl;`,
      wrapperType: "function_call",
      functionName: "reverseString",
      samples: [{ input: "hello", expectedOutput: "olleh", description: "Basic" }],
      hidden: [],
    },
  },
  "max-subarray": {
    python: {
      driver: `for nums in [[-2,1,-3,4,-1,2,1,-5,4],[1],[5,4,-1,7,8],[-1],[-2,-3,-1],[1,2,3,4],[-2,1,-3,4,-1,2],[-1,-2,-3,-4,-5,-6,-7,-8,-9,-10],[0,0,0],[10,-2,-3,5,-1,8,-5],[-10000],[10000]]:
    print(max_subarray(nums))`,
      wrapperType: "function_call",
      functionName: "max_subarray",
      samples: [{ input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", description: "Kadane's algorithm" }],
      hidden: [{ input: "[-1]", expectedOutput: "-1", category: "edge" }],
    },
    javascript: {
      driver: `[[-2,1,-3,4,-1,2,1,-5,4],[1],[5,4,-1,7,8],[-1],[-2,-3,-1],[1,2,3,4],[-2,1,-3,4,-1,2],[-1,-2,-3,-4,-5,-6,-7,-8,-9,-10],[0,0,0],[10,-2,-3,5,-1,8,-5],[-10000],[10000]].forEach(a => console.log(maxSubArray(a)));`,
      wrapperType: "function_call",
      functionName: "maxSubArray",
      samples: [{ input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", description: "Basic" }],
      hidden: [],
    },
    cpp: {
      driver: `vector<vector<int>> tests = {{-2,1,-3,4,-1,2,1,-5,4},{1},{5,4,-1,7,8},{-1},{-2,-3,-1},{1,2,3,4},{-2,1,-3,4,-1,2},{-1,-2,-3,-4,-5,-6,-7,-8,-9,-10},{0,0,0},{10,-2,-3,5,-1,8,-5},{-10000},{10000}};
for (auto& nums : tests) {
    int best = nums[0], cur = nums[0];
    for (int i=1;i<(int)nums.size();i++) { cur = max(nums[i], cur+nums[i]); best = max(best, cur); }
    cout << best << endl;
}`,
      wrapperType: "function_call",
      functionName: "max_subarray",
      samples: [{ input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", description: "Basic" }],
      hidden: [],
    },
  },
  "contains-duplicate": {
    python: {
      driver: `for nums in [[1,2,3,1],[1,2,3,4],[1],[10,10,10,10,10,10,10,10,10,10],[-1,-2,-3],[100,200,300,200,400],[0,0,0,0,0,0],[1000000000,-1000000000,0],[42,42]]:
    print("true" if contains_duplicate(nums) else "false")`,
      wrapperType: "function_call",
      functionName: "contains_duplicate",
      samples: [{ input: "[1,2,3,1]", expectedOutput: "true", description: "Has duplicate" }],
      hidden: [{ input: "[]", expectedOutput: "false", category: "edge" }],
    },
    javascript: {
      driver: `[[1,2,3,1],[1,2,3,4],[1],[10,10,10,10,10,10,10,10,10,10],[-1,-2,-3],[100,200,300,200,400],[0,0,0,0,0,0],[1000000000,-1000000000,0],[42,42]].forEach(a => console.log(containsDuplicate(a) ? 'true' : 'false'));`,
      wrapperType: "function_call",
      functionName: "containsDuplicate",
      samples: [{ input: "[1,2,3,1]", expectedOutput: "true", description: "Basic" }],
      hidden: [],
    },
    cpp: {
      driver: `vector<vector<int>> tests = {{1,2,3,1},{1,2,3,4},{1},{10,10,10,10,10,10,10,10,10,10},{-1,-2,-3},{100,200,300,200,400},{0,0,0,0,0,0},{1000000000,-1000000000,0},{42,42}};
for (auto& a : tests) cout << (containsDuplicate(a)?"true":"false") << endl;`,
      wrapperType: "function_call",
      functionName: "containsDuplicate",
      samples: [{ input: "[1,2,3,1]", expectedOutput: "true", description: "Basic" }],
      hidden: [],
    },
  },
  "bubble-sort": {
    python: {
      driver: `for nums in [[64,34,25,12,22],[5,1,4,2,8],[1],[-5,-10,0,3,8,-1],[100,-100],[0,0,0,-1,-1,5,5]]:
    bubble_sort(nums)
    print(*nums)`,
      wrapperType: "function_call",
      functionName: "bubble_sort",
      samples: [{ input: "[64,34,25,12,22]", expectedOutput: "12 22 25 34 64", description: "Basic sort" }],
      hidden: [{ input: "[]", expectedOutput: "null", category: "edge" }],
    },
    javascript: {
      driver: `[[64,34,25,12,22],[5,1,4,2,8],[1],[-5,-10,0,3,8,-1],[100,-100],[0,0,0,-1,-1,5,5]].forEach(a => { bubbleSort(a); console.log(a.join(' ')); });`,
      wrapperType: "function_call",
      functionName: "bubbleSort",
      samples: [{ input: "[64,34,25,12,22]", expectedOutput: "12 22 25 34 64", description: "Basic" }],
      hidden: [],
    },
    cpp: {
      driver: `vector<vector<int>> tests = {{64,34,25,12,22},{5,1,4,2,8},{1},{-5,-10,0,3,8,-1},{100,-100},{0,0,0,-1,-1,5,5}};
for (auto& a : tests) {
    bubbleSort(a);
    for(int i=0;i<(int)a.size();i++){if(i)cout<<" ";cout<<a[i];}
    cout<<endl;
}`,
      wrapperType: "function_call",
      functionName: "bubbleSort",
      samples: [{ input: "[64,34,25,12,22]", expectedOutput: "12 22 25 34 64", description: "Basic" }],
      hidden: [],
    },
  },
  "climbing-stairs": {
    python: {
      driver: `for n in [1,2,3,4,5,6,10,15,20,45]:
    print(climb_stairs(n))`,
      wrapperType: "function_call",
      functionName: "climb_stairs",
      samples: [{ input: "n=2", expectedOutput: "1\n2\n3\n5\n8\n13\n89\n610\n6765\n1836311903", description: "Fibonacci-like" }],
      hidden: [{ input: "n=45", expectedOutput: "1836311903", category: "stress" }],
    },
    javascript: {
      driver: `[1,2,3,4,5,6,10,15,20,45].forEach(n => console.log(climbStairs(n)));`,
      wrapperType: "function_call",
      functionName: "climbStairs",
      samples: [{ input: "n=2", expectedOutput: "1\n2\n3\n5\n8\n13\n89\n610\n6765\n1836311903", description: "Basic" }],
      hidden: [],
    },
    cpp: {
      driver: `for (int n : {1,2,3,4,5,6,10,15,20,45}) cout<<climbStairs(n)<<endl;`,
      wrapperType: "function_call",
      functionName: "climbStairs",
      samples: [{ input: "n=2", expectedOutput: "1\n2\n3\n5\n8\n13\n89\n610\n6765\n1836311903", description: "Basic" }],
      hidden: [],
    },
  },
  "best-time-to-buy-and-sell-stock": {
    python: {
      driver: `for prices in [[7,1,5,3,6,4],[7,6,4,3,1],[1,2],[7,2,4,1,11,7,5,3],[3,3,3,3],[1,2,3],[3,2,1],[10000,1,2,3,4,5,6,7,8,9],[9,8,7,6,5,4],[0,0,0,0,0,0]]:
    print(max_profit(prices))`,
      wrapperType: "function_call",
      functionName: "max_profit",
      samples: [{ input: "[7,1,5,3,6,4]", expectedOutput: "5", description: "Basic profit" }],
      hidden: [{ input: "[7,6,4,3,1]", expectedOutput: "0", category: "edge" }],
    },
    javascript: {
      driver: `[[7,1,5,3,6,4],[7,6,4,3,1],[1,2],[7,2,4,1,11,7,5,3],[3,3,3,3],[1,2,3],[3,2,1],[10000,1,2,3,4,5,6,7,8,9],[9,8,7,6,5,4],[0,0,0,0,0,0]].forEach(a => console.log(maxProfit(a)));`,
      wrapperType: "function_call",
      functionName: "maxProfit",
      samples: [{ input: "[7,1,5,3,6,4]", expectedOutput: "5", description: "Basic" }],
      hidden: [],
    },
    cpp: {
      driver: `vector<vector<int>> tests = {{7,1,5,3,6,4},{7,6,4,3,1},{1,2},{7,2,4,1,11,7,5,3},{3,3,3,3},{1,2,3},{3,2,1},{10000,1,2,3,4,5,6,7,8,9},{9,8,7,6,5,4},{0,0,0,0,0,0}};
for (auto& prices : tests) cout << max_profit(prices) << endl;`,
      wrapperType: "function_call",
      functionName: "max_profit",
      samples: [{ input: "[7,1,5,3,6,4]", expectedOutput: "5", description: "Basic" }],
      hidden: [],
    },
  },
  "longest-common-prefix": {
    python: {
      driver: `for strs in [["flower","flow","flight"],["dog","racecar","car"],["hello"],["same","same","same"],["a","abc"],["abc","abcde"],["abcdef","abc","abcdefg"],["","a"],["abcd","abc","abc"],["a","aa"]]:
    print(longest_common_prefix(strs))`,
      wrapperType: "function_call",
      functionName: "longest_common_prefix",
      samples: [{ input: '["flower","flow","flight"]', expectedOutput: "fl", description: "Basic LCP" }],
      hidden: [{ input: '[""]', expectedOutput: "null", category: "edge" }],
    },
    javascript: {
      driver: `[["flower","flow","flight"],["dog","racecar","car"],["hello"],["same","same","same"],["a","abc"],["abc","abcde"],["abcdef","abc","abcdefg"],["","a"],["abcd","abc","abc"],["a","aa"]].forEach(a => console.log(longestCommonPrefix(a)));`,
      wrapperType: "function_call",
      functionName: "longestCommonPrefix",
      samples: [{ input: '["flower","flow","flight"]', expectedOutput: "fl", description: "Basic" }],
      hidden: [],
    },
    cpp: {
      driver: `vector<vector<string>> tests = {{"flower","flow","flight"},{"dog","racecar","car"},{"hello"},{"same","same","same"},{"a","abc"},{"abc","abcde"},{"abcdef","abc","abcdefg"},{"","a"},{"abcd","abc","abc"},{"a","aa"}};
for (auto& strs : tests) cout << longestCommonPrefix(strs) << endl;`,
      wrapperType: "function_call",
      functionName: "longestCommonPrefix",
      samples: [{ input: '["flower","flow","flight"]', expectedOutput: "fl", description: "Basic" }],
      hidden: [],
    },
  },
};

async function seedTestCases() {
  const shouldClose = mongoose.connection.readyState === 0;
  if (shouldClose) {
    await mongoose.connect(MONGO_URI);
    console.log("[seed-testcases] Connected to MongoDB");
  }

  let createdCases = 0;
  let createdDrivers = 0;

  for (const [problemId, languages] of Object.entries(TEST_CASES)) {
    for (const [lang, config] of Object.entries(languages)) {
      await DriverTemplate.findOneAndUpdate(
        { problemId, language: lang },
        {
          $set: {
            driverCode: config.driver,
            wrapperType: config.wrapperType,
            functionName: config.functionName,
          },
        },
        { upsert: true, new: true }
      );
      createdDrivers++;

      for (let i = 0; i < config.samples.length; i++) {
        const tc = config.samples[i];
        const exists = await TestCase.findOne({ problemId, language: lang, input: tc.input, visibility: "public" });
        if (!exists) {
          await TestCase.create({
            problemId, language: lang, visibility: "public", category: "sample",
            input: tc.input, expectedOutput: tc.expectedOutput,
            description: tc.description || "", order: i, weight: 1,
          });
          createdCases++;
        }
      }

      for (let i = 0; i < (config.hidden || []).length; i++) {
        const tc = config.hidden[i];
        const exists = await TestCase.findOne({ problemId, language: lang, input: tc.input, visibility: "hidden" });
        if (!exists) {
          await TestCase.create({
            problemId, language: lang, visibility: "hidden", category: tc.category || "hidden",
            input: tc.input, expectedOutput: tc.expectedOutput,
            description: tc.description || "", order: i + config.samples.length, weight: 1,
          });
          createdCases++;
        }
      }
    }
  }

  console.log(`[seed-testcases] Created ${createdCases} test cases and ${createdDrivers} driver templates`);
  if (shouldClose) {
    await mongoose.disconnect();
    console.log("[seed-testcases] Done");
  }
}

module.exports = seedTestCases;

if (require.main === module) {
  seedTestCases().catch(err => {
    console.error("[seed-testcases] Error:", err);
    process.exit(1);
  });
}
