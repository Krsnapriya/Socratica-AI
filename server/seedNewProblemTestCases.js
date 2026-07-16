require("dotenv").config();
const mongoose = require("mongoose");
const TestCase = require("./models/TestCase");
const DriverTemplate = require("./models/DriverTemplate");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27018/socratica";

const NEW_PROBLEMS_TEST_CASES = {
  "binary-tree-inorder": {
    python: {
      driver: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(vals):
    if not vals: return None
    nodes = [TreeNode(v) if v is not None else None for v in vals]
    kids = nodes[::-1]
    root = kids.pop()
    for node in nodes:
        if node:
            if kids: node.left = kids.pop()
            if kids: node.right = kids.pop()
    return root

for vals in [[1,None,2,3],[1,2,3,4,5,None,8,None,None,6,7,9],[],[1],[1,2],[1,None,2],[4,2,6,1,3,5,7]]:
    root = build_tree(vals)
    print(inorderTraversal(root))`,
      wrapperType: "function_call",
      functionName: "inorderTraversal",
      samples: [
        { input: "[1,None,2,3]", expectedOutput: "[1, 3, 2]", description: "Basic tree" },
        { input: "[]", expectedOutput: "[]", description: "Empty tree" },
        { input: "[1]", expectedOutput: "[1]", description: "Single node" },
      ],
      hidden: [
        { input: "[1,2,3,4,5,None,8,None,None,6,7,9]", expectedOutput: "[4, 2, 6, 1, 7, 3, 9, 8]", category: "edge" },
        { input: "[1,None,2]", expectedOutput: "[1, 2]", category: "boundary" },
        { input: "[1,2,None,3,None,4,None,5]", expectedOutput: "[5, 4, 3, 2, 1]", category: "edge" },
      ],
    },
    javascript: {
      driver: `class TreeNode {
    constructor(val, left, right) {
        this.val = (val===undefined ? 0 : val);
        this.left = (left===undefined ? null : left);
        this.right = (right===undefined ? null : right);
    }
}

function buildTree(vals) {
    if (!vals.length) return null;
    const nodes = vals.map(v => v !== null ? new TreeNode(v) : null);
    const kids = nodes.reverse();
    const root = kids.pop();
    for (const node of nodes) {
        if (node) {
            if (kids.length) node.left = kids.pop();
            if (kids.length) node.right = kids.pop();
        }
    }
    return root;
}

[[1,null,2,3],[1,2,3,4,5,null,8,null,null,6,7,9],[],[1]].forEach(vals => {
    console.log(JSON.stringify(inorderTraversal(buildTree(vals))));
});`,
      wrapperType: "function_call",
      functionName: "inorderTraversal",
      samples: [
        { input: "[1,null,2,3]", expectedOutput: "[1,3,2]", description: "Basic tree" },
      ],
      hidden: [
        { input: "[1,null,2]", expectedOutput: "[1,2]", category: "boundary" },
        { input: "[]", expectedOutput: "[]", category: "edge" },
      ],
    },
    cpp: {
      driver: `struct TreeNode { int val; TreeNode *left; TreeNode *right; TreeNode(int x) : val(x), left(NULL), right(NULL) {} };

TreeNode* buildTree(vector<int>& vals) {
    if (vals.empty()) return NULL;
    vector<TreeNode*> nodes;
    for (int v : vals) nodes.push_back(v == -1 ? NULL : new TreeNode(v));
    reverse(nodes.begin(), nodes.end());
    TreeNode* root = nodes.back(); nodes.pop_back();
    for (TreeNode* n : nodes) {
        if (n) { if (!nodes.empty()) { n->left = nodes.back(); nodes.pop_back(); } if (!nodes.empty()) { n->right = nodes.back(); nodes.pop_back(); } }
    }
    return root;
}

vector<vector<int>> tests = {{1,-1,2,3},{},{1},{1,2,3,4,5,-1,8,-1,-1,6,7,9}};
for (auto& t : tests) {
    TreeNode* root = buildTree(t);
    auto r = inorderTraversal(root);
    for(int i=0;i<(int)r.size();i++){if(i)cout<<" ";cout<<r[i];}
    cout<<endl;
}`,
      wrapperType: "function_call",
      functionName: "inorderTraversal",
      samples: [{ input: "[1,-1,2,3]", expectedOutput: "1 3 2", description: "Basic" }],
      hidden: [
        { input: "[1,-1,2]", expectedOutput: "1 2", category: "boundary" },
        { input: "[]", expectedOutput: "", category: "edge" },
      ],
    },
  },

  "validate-bst": {
    python: {
      driver: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(vals):
    if not vals: return None
    nodes = [TreeNode(v) if v is not None else None for v in vals]
    kids = nodes[::-1]
    root = kids.pop()
    for node in nodes:
        if node:
            if kids: node.left = kids.pop()
            if kids: node.right = kids.pop()
    return root

for vals in [[2,1,3],[5,1,4,None,None,3,6],[1],[1,1],[5,4,6,None,None,3,7]]:
    print("true" if isValidBST(build_tree(vals)) else "false")`,
      wrapperType: "function_call",
      functionName: "isValidBST",
      samples: [
        { input: "[2,1,3]", expectedOutput: "true", description: "Valid BST" },
        { input: "[5,1,4,None,None,3,6]", expectedOutput: "false", description: "Invalid BST" },
      ],
      hidden: [
        { input: "[1]", expectedOutput: "true", category: "edge" },
        { input: "[1,1]", expectedOutput: "false", category: "boundary" },
        { input: "[5,4,6,None,None,3,7]", expectedOutput: "false", category: "edge" },
      ],
    },
    javascript: {
      driver: `class TreeNode { constructor(val,left,right) { this.val=val; this.left=left||null; this.right=right||null; } }
function buildTree(v) { if(!v.length) return null; let n=v.map(x=>x!==null?new TreeNode(x):null); let k=n.reverse(); let r=k.pop(); for(let x of n){if(x){if(k.length)x.left=k.pop();if(k.length)x.right=k.pop();}} return r; }
[[2,1,3],[5,1,4,null,null,3,6],[1],[1,1],[5,4,6,null,null,3,7]].forEach(v => console.log(isValidBST(buildTree(v)) ? 'true' : 'false'));`,
      wrapperType: "function_call",
      functionName: "isValidBST",
      samples: [{ input: "[2,1,3]", expectedOutput: "true", description: "Valid BST" }],
      hidden: [
        { input: "[1,1]", expectedOutput: "false", category: "boundary" },
        { input: "[5,4,6,null,null,3,7]", expectedOutput: "false", category: "edge" },
      ],
    },
    cpp: {
      driver: `struct TreeNode { int val; TreeNode *left, *right; TreeNode(int x):val(x),left(NULL),right(NULL){} };
TreeNode* buildTree(vector<int>& v) { if(v.empty()) return NULL; vector<TreeNode*> n; for(int x:v) n.push_back(x==-1?NULL:new TreeNode(x)); reverse(n.begin(),n.end()); TreeNode* r=n.back(); n.pop_back(); for(TreeNode* t:n){if(t){if(!n.empty()){t->left=n.back();n.pop_back();}if(!n.empty()){t->right=n.back();n.pop_back();}}} return r; }
vector<vector<int>> tests={{2,1,3},{5,1,4,-1,-1,3,6},{1},{1,1},{5,4,6,-1,-1,3,7}};
for(auto&t:tests){TreeNode*root=buildTree(t); cout<<(isValidBST(root)?"true":"false")<<endl;}`,
      wrapperType: "function_call",
      functionName: "isValidBST",
      samples: [{ input: "[2,1,3]", expectedOutput: "true", description: "Valid" }],
      hidden: [
        { input: "[1,1]", expectedOutput: "false", category: "boundary" },
      ],
    },
  },

  "number-of-islands": {
    python: {
      driver: `for grid in [
    [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]],
    [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]],
    [["1","0","1","0","1"],["0","1","0","1","0"],["1","0","1","0","1"]],
    [["1"]],
    [["0"]],
    [["0","0","0"],["0","0","0"],["0","0","0"]]
]:
    print(numIslands(grid))`,
      wrapperType: "function_call",
      functionName: "numIslands",
      samples: [
        { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: "1", description: "One island" },
        { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: "3", description: "Three islands" },
      ],
      hidden: [
        { input: '[["1"]]', expectedOutput: "1", category: "edge" },
        { input: '[["0"]]', expectedOutput: "0", category: "edge" },
        { input: '[["0","0","0"],["0","0","0"],["0","0","0"]]', expectedOutput: "0", category: "boundary" },
        { input: '[["1","0","1","0","1"],["0","1","0","1","0"],["1","0","1","0","1"]]', expectedOutput: "5", category: "edge" },
      ],
    },
    javascript: {
      driver: `[
    [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]],
    [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]],
    [["1"]],
    [["0"]]
].forEach(g => console.log(numIslands(g)));`,
      wrapperType: "function_call",
      functionName: "numIslands",
      samples: [{ input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: "1", description: "Basic" }],
      hidden: [
        { input: '[["1"]]', expectedOutput: "1", category: "edge" },
        { input: '[["0"]]', expectedOutput: "0", category: "edge" },
      ],
    },
    cpp: {
      driver: `vector<vector<vector<char>>> tests = {
    {{'1','1','1','1','0'},{'1','1','0','1','0'},{'1','1','0','0','0'},{'0','0','0','0','0'}},
    {{'1','1','0','0','0'},{'1','1','0','0','0'},{'0','0','1','0','0'},{'0','0','0','1','1'}},
    {{'1'}},
    {{'0'}}
};
for(auto& g : tests) cout << numIslands(g) << endl;`,
      wrapperType: "function_call",
      functionName: "numIslands",
      samples: [{ input: "grid", expectedOutput: "1", description: "Basic" }],
      hidden: [
        { input: "[[1]]", expectedOutput: "1", category: "edge" },
        { input: "[[0]]", expectedOutput: "0", category: "edge" },
      ],
    },
  },

  "course-schedule": {
    python: {
      driver: `for n,prereqs in [
    (2, [[1,0]]),
    (2, [[1,0],[0,1]]),
    (4, [[1,0],[2,1],[3,2]]),
    (1, []),
    (3, [[1,0],[2,0]]),
    (3, [[0,1],[1,2],[2,0]])
]:
    print("true" if canFinish(n, prereqs) else "false")`,
      wrapperType: "function_call",
      functionName: "canFinish",
      samples: [
        { input: "2, [[1,0]]", expectedOutput: "true", description: "Simple course" },
        { input: "2, [[1,0],[0,1]]", expectedOutput: "false", description: "Cycle" },
      ],
      hidden: [
        { input: "4, [[1,0],[2,1],[3,2]]", expectedOutput: "true", category: "edge" },
        { input: "1, []", expectedOutput: "true", category: "edge" },
        { input: "3, [[0,1],[1,2],[2,0]]", expectedOutput: "false", category: "boundary" },
      ],
    },
    javascript: {
      driver: `[[2,[[1,0]]],[2,[[1,0],[0,1]]],[4,[[1,0],[2,1],[3,2]]],[1,[]],[3,[[0,1],[1,2],[2,0]]]].forEach(([n,p]) => console.log(canFinish(n,p) ? 'true' : 'false'));`,
      wrapperType: "function_call",
      functionName: "canFinish",
      samples: [{ input: "2, [[1,0]]", expectedOutput: "true", description: "Basic" }],
      hidden: [
        { input: "2, [[1,0],[0,1]]", expectedOutput: "false", category: "edge" },
      ],
    },
    cpp: {
      driver: `vector<pair<int,vector<vector<int>>>> tests = {{2,{{1,0}}},{2,{{1,0},{0,1}}},{4,{{1,0},{2,1},{3,2}}},{1,{}},{3,{{0,1},{1,2},{2,0}}}};
for(auto&[n,p]:tests) cout<<(canFinish(n,p)?"true":"false")<<endl;`,
      wrapperType: "function_call",
      functionName: "canFinish",
      samples: [{ input: "2, {{1,0}}", expectedOutput: "true", description: "Basic" }],
      hidden: [
        { input: "2, {{1,0},{0,1}}", expectedOutput: "false", category: "edge" },
      ],
    },
  },

  "merge-k-sorted-lists": {
    python: {
      driver: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def to_list(head):
    r = []
    while head:
        r.append(head.val)
        head = head.next
    return r

def from_list(vals):
    dummy = ListNode(0)
    curr = dummy
    for v in vals:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

lists = [[from_list([1,4,5]), from_list([1,3,4]), from_list([2,6])],
         [from_list([]), from_list([])],
         [from_list([1])],
         [from_list([1,2,3]), from_list([4,5,6]), from_list([7,8,9])]]
for l in lists:
    print(to_list(mergeKLists(l)))`,
      wrapperType: "function_call",
      functionName: "mergeKLists",
      samples: [
        { input: "[[1,4,5],[1,3,4],[2,6]]", expectedOutput: "[1, 1, 2, 3, 4, 4, 5, 6]", description: "Three lists" },
        { input: "[[],[]]", expectedOutput: "[]", description: "Empty lists" },
      ],
      hidden: [
        { input: "[[1]]", expectedOutput: "[1]", category: "edge" },
        { input: "[[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[1, 2, 3, 4, 5, 6, 7, 8, 9]", category: "boundary" },
      ],
    },
    javascript: {
      driver: `class ListNode { constructor(val,next) { this.val=val; this.next=next||null; } }
function fromList(v) { let d=new ListNode(0),c=d; for(let x of v){c.next=new ListNode(x);c=c.next;} return d.next; }
function toList(h) { let r=[]; while(h){r.push(h.val);h=h.next;} return r; }
[[fromList([1,4,5]),fromList([1,3,4]),fromList([2,6])],[fromList([]),fromList([])],fromList([1])].forEach(l => {
    let r = mergeKLists(Array.isArray(l)?l:[l]);
    console.log(toList(r));
});`,
      wrapperType: "function_call",
      functionName: "mergeKLists",
      samples: [{ input: "[[1,4,5],[1,3,4],[2,6]]", expectedOutput: "[1,1,2,3,4,4,5,6]", description: "Basic" }],
      hidden: [
        { input: "[[1]]", expectedOutput: "[1]", category: "edge" },
      ],
    },
    cpp: {
      driver: `// ListNode struct provided
// Tests with linked lists converted to arrays for output
vector<vector<int>> inputs = {{1,4,5,1,3,4,2,6},{},{1}};
for(auto& v : inputs) {
    // Build and merge k lists, print result
    cout << endl;
}`,
      wrapperType: "function_call",
      functionName: "mergeKLists",
      samples: [{ input: "lists", expectedOutput: "1 1 2 3 4 4 5 6", description: "Basic" }],
      hidden: [
        { input: "[]", expectedOutput: "", category: "edge" },
      ],
    },
  },

  "word-break": {
    python: {
      driver: `for s,dict in [
    ("leetcode", ["leet","code"]),
    ("applepenapple", ["apple","pen"]),
    ("catsandog", ["cats","dog","sand","and","cat"]),
    ("", ["a"]),
    ("a", ["a"]),
    ("ab", ["a","b"]),
    ("abcd", ["a","abc","cd"]),
    ("aaaaaaa", ["aaaa","aaa"]),
    ("cars", ["car","ca","rs"])
]:
    print("true" if wordBreak(s, dict) else "false")`,
      wrapperType: "function_call",
      functionName: "wordBreak",
      samples: [
        { input: '"leetcode", ["leet","code"]', expectedOutput: "true", description: "Can segment" },
        { input: '"catsandog", ["cats","dog","sand","and","cat"]', expectedOutput: "false", description: "Cannot segment" },
      ],
      hidden: [
        { input: '"", ["a"]', expectedOutput: "true", category: "edge" },
        { input: '"a", ["a"]', expectedOutput: "true", category: "edge" },
        { input: '"ab", ["a","b"]', expectedOutput: "true", category: "boundary" },
        { input: '"aaaaaaa", ["aaaa","aaa"]', expectedOutput: "true", category: "edge" },
      ],
    },
    javascript: {
      driver: `[["leetcode",["leet","code"]],["applepenapple",["apple","pen"]],["catsandog",["cats","dog","sand","and","cat"]],["",["a"]],["a",["a"]],["ab",["a","b"]]].forEach(([s,d]) => console.log(wordBreak(s,d) ? 'true' : 'false'));`,
      wrapperType: "function_call",
      functionName: "wordBreak",
      samples: [{ input: '"leetcode", ["leet","code"]', expectedOutput: "true", description: "Basic" }],
      hidden: [
        { input: '"", ["a"]', expectedOutput: "true", category: "edge" },
        { input: '"a", ["a"]', expectedOutput: "true", category: "edge" },
      ],
    },
    cpp: {
      driver: `vector<pair<string,vector<string>>> tests = {{"leetcode",{"leet","code"}},{"applepenapple",{"apple","pen"}},{"catsandog",{"cats","dog","sand","and","cat"}},{"",{"a"}},{"a",{"a"}}};
for(auto&[s,d]:tests) cout<<(wordBreak(s,d)?"true":"false")<<endl;`,
      wrapperType: "function_call",
      functionName: "wordBreak",
      samples: [{ input: '"leetcode"', expectedOutput: "true", description: "Basic" }],
      hidden: [
        { input: '""', expectedOutput: "true", category: "edge" },
      ],
    },
  },

  "lru-cache": {
    python: {
      driver: `cache = LRUCache(2)
cache.put(1, 1)
cache.put(2, 2)
print(cache.get(1))
cache.put(3, 3)
print(cache.get(2))
cache.put(4, 4)
print(cache.get(1))
print(cache.get(3))
print(cache.get(4))

cache2 = LRUCache(1)
cache2.put(2, 1)
print(cache2.get(2))
cache2.put(3, 2)
print(cache2.get(2))
print(cache2.get(3))`,
      wrapperType: "function_call",
      functionName: "LRUCache",
      samples: [
        { input: "capacity=2, put(1,1), put(2,2), get(1)", expectedOutput: "1", description: "Basic LRU" },
      ],
      hidden: [
        { input: "capacity=1, put(2,1), get(2), put(3,2), get(2), get(3)", expectedOutput: "1\n-1\n2", category: "edge" },
        { input: "capacity=2, put(1,1), put(2,2), get(1), put(3,3), get(2), put(4,4), get(1), get(3), get(4)", expectedOutput: "1\n-1\n-1\n3\n4", category: "boundary" },
      ],
    },
    javascript: {
      driver: `let c = new LRUCache(2);
c.put(1,1); c.put(2,2);
console.log(c.get(1));
c.put(3,3);
console.log(c.get(2));
c.put(4,4);
console.log(c.get(1));
console.log(c.get(3));
console.log(c.get(4));`,
      wrapperType: "function_call",
      functionName: "LRUCache",
      samples: [{ input: "capacity=2", expectedOutput: "1", description: "Basic" }],
      hidden: [
        { input: "capacity=2, get after eviction", expectedOutput: "-1", category: "edge" },
      ],
    },
    cpp: {
      driver: `LRUCache c(2);
c.put(1,1); c.put(2,2);
cout<<c.get(1)<<endl;
c.put(3,3);
cout<<c.get(2)<<endl;
c.put(4,4);
cout<<c.get(1)<<endl;
cout<<c.get(3)<<endl;
cout<<c.get(4)<<endl;`,
      wrapperType: "function_call",
      functionName: "LRUCache",
      samples: [{ input: "capacity=2", expectedOutput: "1", description: "Basic" }],
      hidden: [
        { input: "capacity=2, eviction", expectedOutput: "-1", category: "edge" },
      ],
    },
  },

  "trapping-rain-water": {
    python: {
      driver: `for height in [[0,1,0,2,1,0,1,3,2,1,2,1],[4,2,0,3,2,5],[1],[0],[1,2],[2,1],[0,1,0],[4,2,3,1]]:
    print(trap(height))`,
      wrapperType: "function_call",
      functionName: "trap",
      samples: [
        { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6", description: "Classic" },
        { input: "[4,2,0,3,2,5]", expectedOutput: "9", description: "Valley" },
      ],
      hidden: [
        { input: "[1]", expectedOutput: "0", category: "edge" },
        { input: "[0]", expectedOutput: "0", category: "edge" },
        { input: "[1,2]", expectedOutput: "0", category: "boundary" },
        { input: "[2,1]", expectedOutput: "0", category: "boundary" },
        { input: "[0,1,0]", expectedOutput: "0", category: "edge" },
      ],
    },
    javascript: {
      driver: `[[0,1,0,2,1,0,1,3,2,1,2,1],[4,2,0,3,2,5],[1],[0],[1,2]].forEach(h => console.log(trap(h)));`,
      wrapperType: "function_call",
      functionName: "trap",
      samples: [{ input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6", description: "Basic" }],
      hidden: [
        { input: "[1]", expectedOutput: "0", category: "edge" },
        { input: "[0]", expectedOutput: "0", category: "edge" },
      ],
    },
    cpp: {
      driver: `vector<vector<int>> tests = {{0,1,0,2,1,0,1,3,2,1,2,1},{4,2,0,3,2,5},{1},{0},{1,2},{2,1}};
for(auto& h : tests) cout << trap(h) << endl;`,
      wrapperType: "function_call",
      functionName: "trap",
      samples: [{ input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6", description: "Basic" }],
      hidden: [
        { input: "[1]", expectedOutput: "0", category: "edge" },
        { input: "[1,2]", expectedOutput: "0", category: "boundary" },
      ],
    },
  },

  "n-queens": {
    python: {
      driver: `for n in [1, 2, 3, 4, 5, 8]:
    result = solveNQueens(n)
    print(f"n={n}: {len(result)} solutions")`,
      wrapperType: "function_call",
      functionName: "solveNQueens",
      samples: [
        { input: "n=4", expectedOutput: "n=4: 2 solutions", description: "4-queens" },
        { input: "n=1", expectedOutput: "n=1: 1 solutions", description: "1-queen" },
      ],
      hidden: [
        { input: "n=2", expectedOutput: "n=2: 0 solutions", category: "edge" },
        { input: "n=3", expectedOutput: "n=3: 0 solutions", category: "edge" },
        { input: "n=8", expectedOutput: "n=8: 92 solutions", category: "stress" },
      ],
    },
    javascript: {
      driver: `[1,2,3,4,5].forEach(n => console.log(\`n=\${n}: \${solveNQueens(n).length} solutions\`));`,
      wrapperType: "function_call",
      functionName: "solveNQueens",
      samples: [{ input: "n=4", expectedOutput: "n=4: 2 solutions", description: "Basic" }],
      hidden: [
        { input: "n=2", expectedOutput: "n=2: 0 solutions", category: "edge" },
        { input: "n=8", expectedOutput: "n=8: 92 solutions", category: "stress" },
      ],
    },
    cpp: {
      driver: `for(int n:{1,2,3,4,5,8}) cout<<"n="<<n<<": "<<solveNQueens(n).size()<<" solutions"<<endl;`,
      wrapperType: "function_call",
      functionName: "solveNQueens",
      samples: [{ input: "n=4", expectedOutput: "n=4: 2 solutions", description: "Basic" }],
      hidden: [
        { input: "n=2", expectedOutput: "n=2: 0 solutions", category: "edge" },
        { input: "n=8", expectedOutput: "n=8: 92 solutions", category: "stress" },
      ],
    },
  },

  "median-of-two-sorted-arrays": {
    python: {
      driver: `for nums1,nums2 in [
    ([1,3], [2]),
    ([1,2], [3,4]),
    ([0,0], [0,0]),
    ([], [1]),
    ([2], []),
    ([1,2,3], [4,5,6]),
    ([1,3,5,7], [2,4,6,8]),
    ([1,2,3,4,5], [6,7,8,9,10])
]:
    print(findMedianSortedArrays(nums1, nums2))`,
      wrapperType: "function_call",
      functionName: "findMedianSortedArrays",
      samples: [
        { input: "[1,3], [2]", expectedOutput: "2", description: "Odd total" },
        { input: "[1,2], [3,4]", expectedOutput: "2.5", description: "Even total" },
      ],
      hidden: [
        { input: "[0,0], [0,0]", expectedOutput: "0", category: "edge" },
        { input: "[], [1]", expectedOutput: "1", category: "edge" },
        { input: "[2], []", expectedOutput: "2", category: "edge" },
        { input: "[1,2,3], [4,5,6]", expectedOutput: "3.5", category: "boundary" },
        { input: "[1,3,5,7], [2,4,6,8]", expectedOutput: "4.5", category: "boundary" },
      ],
    },
    javascript: {
      driver: `[[[1,3],[2]],[[1,2],[3,4]],[[0,0],[0,0]],[[],[1]],[[2],[]]].forEach(([a,b]) => console.log(findMedianSortedArrays(a,b)));`,
      wrapperType: "function_call",
      functionName: "findMedianSortedArrays",
      samples: [{ input: "[1,3], [2]", expectedOutput: "2", description: "Basic" }],
      hidden: [
        { input: "[], [1]", expectedOutput: "1", category: "edge" },
        { input: "[0,0], [0,0]", expectedOutput: "0", category: "edge" },
      ],
    },
    cpp: {
      driver: `vector<pair<vector<int>,vector<int>>> tests = {{{1,3},{2}},{{1,2},{3,4}},{{0,0},{0,0}},{},{1,{}},{{2},{}}};
for(auto&[a,b]:tests) cout<<findMedianSortedArrays(const_cast<vector<int>&>(a),const_cast<vector<int>&>(b))<<endl;`,
      wrapperType: "function_call",
      functionName: "findMedianSortedArrays",
      samples: [{ input: "[1,3], [2]", expectedOutput: "2", description: "Basic" }],
      hidden: [
        { input: "[], [1]", expectedOutput: "1", category: "edge" },
      ],
    },
  },
};

async function seedNewTestCases() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    let createdCases = 0;
    let createdDrivers = 0;

    for (const [problemId, languages] of Object.entries(NEW_PROBLEMS_TEST_CASES)) {
      for (const [lang, config] of Object.entries(languages)) {
        if (!config || !config.driver) continue;

        // Create driver template
        const existingDriver = await DriverTemplate.findOne({ problemId, language: lang });
        if (!existingDriver) {
          await DriverTemplate.create({
            problemId,
            language: lang,
            driverCode: config.driver,
            wrapperType: config.wrapperType || "function_call",
            functionName: config.functionName || "",
          });
          createdDrivers++;
        }

        // Create public samples
        for (let i = 0; i < (config.samples || []).length; i++) {
          const tc = config.samples[i];
          const exists = await TestCase.findOne({ problemId, language: lang, input: tc.input, visibility: "public" });
          if (!exists) {
            await TestCase.create({
              problemId,
              language: lang,
              visibility: "public",
              category: "sample",
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              description: tc.description || "",
              order: i,
              weight: 1,
            });
            createdCases++;
          }
        }

        // Create hidden tests
        for (let i = 0; i < (config.hidden || []).length; i++) {
          const tc = config.hidden[i];
          const exists = await TestCase.findOne({ problemId, language: lang, input: tc.input, visibility: "hidden" });
          if (!exists) {
            await TestCase.create({
              problemId,
              language: lang,
              visibility: "hidden",
              category: tc.category || "hidden",
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              description: tc.description || "",
              order: i + (config.samples || []).length,
              weight: 1,
            });
            createdCases++;
          }
        }
      }
    }

    console.log(`\nCreated ${createdDrivers} driver templates and ${createdCases} test cases`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedNewTestCases();