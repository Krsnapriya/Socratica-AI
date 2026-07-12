const PROBLEM_DRIVERS = {
  "two-sum": {
    python: `r = two_sum([2,7,11,15], 9); print(r[0], r[1])
r = two_sum([3,2,4], 6); print(r[0], r[1])
r = two_sum([3,3], 6); print(r[0], r[1])`,
    javascript: `let r = twoSum([2,7,11,15], 9); console.log(r[0], r[1]);
r = twoSum([3,2,4], 6); console.log(r[0], r[1]);
r = twoSum([3,3], 6); console.log(r[0], r[1]);`,
    cpp: `vector<int> a={2,7,11,15}; auto r=twoSum(a,9); cout<<r[0]<<" "<<r[1]<<endl;
vector<int> b={3,2,4}; r=twoSum(b,6); cout<<r[0]<<" "<<r[1]<<endl;
vector<int> c={3,3}; r=twoSum(c,6); cout<<r[0]<<" "<<r[1]<<endl;`,
  },
  "fibonacci": {
    python: `for n in [0,1,2,3,4,5,10,15,20,30]: print(fib(n))`,
    javascript: `[0,1,2,3,4,5,10,15,20,30].forEach(n => console.log(fib(n)));`,
    cpp: `for(int n:{0,1,2,3,4,5,10,15,20,30}) cout<<fib(n)<<endl;`,
  },
  "valid-parentheses": {
    python: `for s in ["()","()[]{}","(]","([)]","{[]}", "{","}","(((((((()","(((())))","[({})]","[(])",""]:
    print("true" if is_valid(s) else "false")`,
    javascript: `["()","()[]{}","(]","([)]","{[]}", "{","}","(((((((()","(((())))","[({})]","[(])", ""].forEach(s => console.log(isValid(s) ? 'true' : 'false'));`,
    cpp: `vector<string> tests = {"()","()[]{}","(]","([)]","{[]}", "{","}","(((((((()","(((())))","[({})]","[(])"};
for (auto& t : tests) cout << (isValid(t)?"true":"false") << endl;`,
  },
  "binary-search": {
    python: `print(binary_search([-1,0,3,5,9,12], 9))
print(binary_search([-1,0,3,5,9,12], 2))
print(binary_search([5], 5))`,
    javascript: `console.log(binarySearch([-1,0,3,5,9,12], 9));
console.log(binarySearch([-1,0,3,5,9,12], 2));
console.log(binarySearch([5], 5));`,
    cpp: `vector<int> a={-1,0,3,5,9,12};
cout<<binarySearch(a,9)<<endl;
cout<<binarySearch(a,2)<<endl;
vector<int> b={5};
cout<<binarySearch(b,5)<<endl;`,
  },
  "reverse-linked-list": {
    python: `for vals in [[1,2,3,4,5],[1,2],[42],[],[0],[-1,-2,-3],[5,4,3,2,1],[1,1,1,1],[-5000,5000],[3,7,0,-4,12]]:
    r = reverse_list(vals)
    print(*r)`,
    javascript: `[[1,2,3,4,5],[1,2],[42],[],[0],[-1,-2,-3],[5,4,3,2,1],[1,1,1,1],[-5000,5000],[3,7,0,-4,12]].forEach(a => console.log(reverseList(a).join(' ')));`,
    cpp: `vector<vector<int>> tests = {{1,2,3,4,5},{1,2},{42},{},{0},{-1,-2,-3},{5,4,3,2,1},{1,1,1,1},{-5000,5000},{3,7,0,-4,12}};
for (auto& v : tests) {
    auto r = reverseList(v);
    for (int i=0;i<(int)r.size();i++){if(i)cout<<" ";cout<<r[i];}
    cout<<endl;
}`,
  },
  "valid-palindrome": {
    python: `for s in ["A man, a plan, a canal: Panama","race a car"," ","0P","a","ab",".,","Aba","Never odd or even","12321","12345",""]:
    print("true" if is_palindrome(s) else "false")`,
    javascript: `["A man, a plan, a canal: Panama","race a car"," ","0P","a","ab",".,","Aba","Never odd or even","12321","12345", ""].forEach(s => console.log(isPalindrome(s) ? 'true' : 'false'));`,
    cpp: `vector<string> tests = {"A man, a plan, a canal: Panama","race a car"," ","0P","a","ab",".,","Aba","Never odd or even","12321","12345"};
for (auto& t : tests) cout << (isPalindrome(t)?"true":"false") << endl;`,
  },
  "reverse-string": {
    python: `for s in ["hello","Hannah","","123456789","a b c","!!@@##","abcdefghijklmnopqrstuvwxyz","   "]:
    print(reverse_string(s))`,
    javascript: `["hello","Hannah","","123456789","a b c","!!@@##","abcdefghijklmnopqrstuvwxyz","   "].forEach(s => console.log(reverseString(s)));`,
    cpp: `vector<string> tests = {"hello","Hannah","","123456789","a b c","!!@@##","abcdefghijklmnopqrstuvwxyz","   "};
for (auto& t : tests) cout << reverseString(t) << endl;`,
  },
  "max-subarray": {
    python: `for nums in [[-2,1,-3,4,-1,2,1,-5,4],[1],[5,4,-1,7,8],[-1],[-2,-3,-1],[1,2,3,4],[-2,1,-3,4,-1,2],[-1,-2,-3,-4,-5,-6,-7,-8,-9,-10],[0,0,0],[10,-2,-3,5,-1,8,-5],[-10000],[10000]]:
    print(max_subarray(nums))`,
    javascript: `[[-2,1,-3,4,-1,2,1,-5,4],[1],[5,4,-1,7,8],[-1],[-2,-3,-1],[1,2,3,4],[-2,1,-3,4,-1,2],[-1,-2,-3,-4,-5,-6,-7,-8,-9,-10],[0,0,0],[10,-2,-3,5,-1,8,-5],[-10000],[10000]].forEach(a => console.log(maxSubArray(a)));`,
    cpp: `vector<vector<int>> tests = {{-2,1,-3,4,-1,2,1,-5,4},{1},{5,4,-1,7,8},{-1},{-2,-3,-1},{1,2,3,4},{-2,1,-3,4,-1,2},{-1,-2,-3,-4,-5,-6,-7,-8,-9,-10},{0,0,0},{10,-2,-3,5,-1,8,-5},{-10000},{10000}};
for (auto& nums : tests) {
    int best = nums[0], cur = nums[0];
    for (int i=1;i<(int)nums.size();i++) { cur = max(nums[i], cur+nums[i]); best = max(best, cur); }
    cout << best << endl;
}`,
  },
  "contains-duplicate": {
    python: `for nums in [[1,2,3,1],[1,2,3,4],[1],[10,10,10,10,10,10,10,10,10,10],[-1,-2,-3],[100,200,300,200,400],[0,0,0,0,0,0],[1000000000,-1000000000,0],[42,42]]:
    print("true" if contains_duplicate(nums) else "false")`,
    javascript: `[[1,2,3,1],[1,2,3,4],[1],[10,10,10,10,10,10,10,10,10,10],[-1,-2,-3],[100,200,300,200,400],[0,0,0,0,0,0],[1000000000,-1000000000,0],[42,42]].forEach(a => console.log(containsDuplicate(a) ? 'true' : 'false'));`,
    cpp: `vector<vector<int>> tests = {{1,2,3,1},{1,2,3,4},{1},{10,10,10,10,10,10,10,10,10,10},{-1,-2,-3},{100,200,300,200,400},{0,0,0,0,0,0},{1000000000,-1000000000,0},{42,42}};
for (auto& a : tests) cout << (containsDuplicate(a)?"true":"false") << endl;`,
  },
  "bubble-sort": {
    python: `for nums in [[64,34,25,12,22],[5,1,4,2,8],[1],[-5,-10,0,3,8,-1],[100,-100],[0,0,0,-1,-1,5,5]]:
    bubble_sort(nums)
    print(*nums)`,
    javascript: `[[64,34,25,12,22],[5,1,4,2,8],[1],[-5,-10,0,3,8,-1],[100,-100],[0,0,0,-1,-1,5,5]].forEach(a => { bubbleSort(a); console.log(a.join(' ')); });`,
    cpp: `vector<vector<int>> tests = {{64,34,25,12,22},{5,1,4,2,8},{1},{-5,-10,0,3,8,-1},{100,-100},{0,0,0,-1,-1,5,5}};
for (auto& a : tests) {
    bubbleSort(a);
    for(int i=0;i<(int)a.size();i++){if(i)cout<<" ";cout<<a[i];}
    cout<<endl;
}`,
  },
  "climbing-stairs": {
    python: `for n in [1,2,3,4,5,6,10,15,20,45]:
    print(climb_stairs(n))`,
    javascript: `[1,2,3,4,5,6,10,15,20,45].forEach(n => console.log(climbStairs(n)));`,
    cpp: `for (int n : {1,2,3,4,5,6,10,15,20,45}) cout<<climbStairs(n)<<endl;`,
  },
  "best-time-to-buy-and-sell-stock": {
    python: `for prices in [[7,1,5,3,6,4],[7,6,4,3,1],[1,2],[7,2,4,1,11,7,5,3],[3,3,3,3],[1,2,3],[3,2,1],[10000,1,2,3,4,5,6,7,8,9],[9,8,7,6,5,4],[0,0,0,0,0,0]]:
    print(max_profit(prices))`,
    javascript: `[[7,1,5,3,6,4],[7,6,4,3,1],[1,2],[7,2,4,1,11,7,5,3],[3,3,3,3],[1,2,3],[3,2,1],[10000,1,2,3,4,5,6,7,8,9],[9,8,7,6,5,4],[0,0,0,0,0,0]].forEach(a => console.log(maxProfit(a)));`,
    cpp: `vector<vector<int>> tests = {{7,1,5,3,6,4},{7,6,4,3,1},{1,2},{7,2,4,1,11,7,5,3},{3,3,3,3},{1,2,3},{3,2,1},{10000,1,2,3,4,5,6,7,8,9},{9,8,7,6,5,4},{0,0,0,0,0,0}};
for (auto& prices : tests) cout << max_profit(prices) << endl;`,
  },
  "longest-common-prefix": {
    python: `for strs in [["flower","flow","flight"],["dog","racecar","car"],["hello"],["same","same","same"],["a","abc"],["abc","abcde"],["abcdef","abc","abcdefg"],["","a"],["abcd","abc","abc"],["a","aa"]]:
    print(longest_common_prefix(strs))`,
    javascript: `[["flower","flow","flight"],["dog","racecar","car"],["hello"],["same","same","same"],["a","abc"],["abc","abcde"],["abcdef","abc","abcdefg"],["","a"],["abcd","abc","abc"],["a","aa"]].forEach(a => console.log(longestCommonPrefix(a)));`,
    cpp: `vector<vector<string>> tests = {{"flower","flow","flight"},{"dog","racecar","car"},{"hello"},{"same","same","same"},{"a","abc"},{"abc","abcde"},{"abcdef","abc","abcdefg"},{"","a"},{"abcd","abc","abc"},{"a","aa"}};
for (auto& strs : tests) cout << longestCommonPrefix(strs) << endl;`,
  },
};

const IO_INDICATORS = ['sys.stdin', 'readline', 'cin >>', 'process.stdin', 'getline', 'std::cin'];

function hasIOWrapper(code) {
  return IO_INDICATORS.some(ind => code.includes(ind));
}

function injectDriver(code, problemId, language) {
  const drivers = PROBLEM_DRIVERS[problemId];
  if (!drivers) return code;
  const driver = drivers[language] || "";
  if (!driver) return code;

  if (language === "cpp") {
    const hasInclude = code.includes("#include");
    const hasMain = code.includes("int main");
    let result = "";
    if (!hasInclude) result += "#include <bits/stdc++.h>\nusing namespace std;\n";
    result += code;
    if (!hasMain) {
      result += "\nint main() {\n" + driver + "\n}\n";
    } else {
      result += "\n" + driver + "\n";
    }
    return result;
  }

  if (hasIOWrapper(code)) {
    return code;
  }

  return code + "\n" + driver + "\n";
}

module.exports = { injectDriver, PROBLEM_DRIVERS };
