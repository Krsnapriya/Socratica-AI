require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Course = require("./models/Course");
const Module = require("./models/Module");
const Problem = require("./models/Problem");
const Submission = require("./models/Submission");
const Session = require("./models/Session");
const Enrollment = require("./models/Enrollment");
const AIConversation = require("./models/AIConversation");
const AIUsage = require("./models/AIUsage");
const LearningPath = require("./models/LearningPath");
const Notification = require("./models/Notification");
const AuditLog = require("./models/AuditLog");
const ReferenceSolution = require("./models/ReferenceSolution");
const config = require("./config");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

// Helper to random element from array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function seedComprehensive() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({});
    const courses = await Course.find({});

    if (users.length === 0) {
      console.error("Run seedUsers.js first!");
      return;
    }

    const students = users.filter(u => u.role === "student");
    const instructors = users.filter(u => u.role === "instructor");
    const admins = users.filter(u => u.role === "admin");

    // 1. Create diverse problems with harder difficulties
    console.log("\n[1/9] Adding diverse problem types...");
    const newProblems = [
      {
        problemId: "binary-tree-inorder",
        title: "Binary Tree Inorder Traversal",
        statement: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
        category: "Trees",
        difficulty: "easy",
        tags: ["tree", "dfs", "recursion"],
        starterCode: {
          python: "def inorderTraversal(root):\n    pass",
          javascript: "function inorderTraversal(root) {\n    \n}",
          cpp: "vector<int> inorderTraversal(TreeNode* root) {\n    \n}"
        }
      },
      {
        problemId: "validate-bst",
        title: "Validate Binary Search Tree",
        statement: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
        category: "Trees",
        difficulty: "medium",
        tags: ["tree", "bst", "dfs"],
        starterCode: {
          python: "def isValidBST(root):\n    pass",
          javascript: "function isValidBST(root) {\n    \n}",
          cpp: "bool isValidBST(TreeNode* root) {\n    \n}"
        }
      },
      {
        problemId: "number-of-islands",
        title: "Number of Islands",
        statement: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
        category: "Graphs",
        difficulty: "medium",
        tags: ["graph", "dfs", "bfs", "matrix"],
        starterCode: {
          python: "def numIslands(grid):\n    pass",
          javascript: "function numIslands(grid) {\n    \n}",
          cpp: "int numIslands(vector<vector<char>>& grid) {\n    \n}"
        }
      },
      {
        problemId: "course-schedule",
        title: "Course Schedule",
        statement: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. Determine if you can finish all courses.",
        category: "Graphs",
        difficulty: "medium",
        tags: ["graph", "topological-sort", "cycle-detection"],
        starterCode: {
          python: "def canFinish(numCourses, prerequisites):\n    pass",
          javascript: "function canFinish(numCourses, prerequisites) {\n    \n}",
          cpp: "bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n    \n}"
        }
      },
      {
        problemId: "merge-k-sorted-lists",
        title: "Merge k Sorted Lists",
        statement: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list.",
        category: "Heaps",
        difficulty: "hard",
        tags: ["heap", "linked-list", "divide-and-conquer"],
        starterCode: {
          python: "def mergeKLists(lists):\n    pass",
          javascript: "function mergeKLists(lists) {\n    \n}",
          cpp: "ListNode* mergeKLists(vector<ListNode*>& lists) {\n    \n}"
        }
      },
      {
        problemId: "word-break",
        title: "Word Break",
        statement: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.",
        category: "Dynamic Programming",
        difficulty: "medium",
        tags: ["dp", "string", "trie"],
        starterCode: {
          python: "def wordBreak(s, wordDict):\n    pass",
          javascript: "function wordBreak(s, wordDict) {\n    \n}",
          cpp: "bool wordBreak(string s, vector<string>& wordDict) {\n    \n}"
        }
      },
      {
        problemId: "lru-cache",
        title: "LRU Cache",
        statement: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
        category: "Design",
        difficulty: "hard",
        tags: ["design", "hashmap", "linked-list"],
        starterCode: {
          python: "class LRUCache:\n    def __init__(self, capacity):\n        pass\n    def get(self, key):\n        pass\n    def put(self, key, value):\n        pass",
          javascript: "class LRUCache {\n    constructor(capacity) {\n        \n    }\n    get(key) {\n        \n    }\n    put(key, value) {\n        \n    }\n}",
          cpp: "class LRUCache {\npublic:\n    LRUCache(int capacity) {\n        \n    }\n    int get(int key) {\n        \n    }\n    void put(int key, int value) {\n        \n    }\n};"
        }
      },
      {
        problemId: "trapping-rain-water",
        title: "Trapping Rain Water",
        statement: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
        category: "Stack",
        difficulty: "hard",
        tags: ["stack", "two-pointers", "dynamic-programming"],
        starterCode: {
          python: "def trap(height):\n    pass",
          javascript: "function trap(height) {\n    \n}",
          cpp: "int trap(vector<int>& height) {\n    \n}"
        }
      },
      {
        problemId: "n-queens",
        title: "N-Queens",
        statement: "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.",
        category: "Backtracking",
        difficulty: "hard",
        tags: ["backtracking", "recursion", "matrix"],
        starterCode: {
          python: "def solveNQueens(n):\n    pass",
          javascript: "function solveNQueens(n) {\n    \n}",
          cpp: "vector<vector<string>> solveNQueens(int n) {\n    \n}"
        }
      },
      {
        problemId: "median-of-two-sorted-arrays",
        title: "Median of Two Sorted Arrays",
        statement: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
        category: "Binary Search",
        difficulty: "hard",
        tags: ["binary-search", "array", "divide-and-conquer"],
        starterCode: {
          python: "def findMedianSortedArrays(nums1, nums2):\n    pass",
          javascript: "function findMedianSortedArrays(nums1, nums2) {\n    \n}",
          cpp: "double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n    \n}"
        }
      }
    ];

    // 2. Create Reference Solutions for new problems
    console.log("\n[2/9] Creating reference solutions...");
    const refSolutions = [
      {
        problemId: "binary-tree-inorder",
        language: "python",
        code: "def inorderTraversal(root):\n    if not root:\n        return []\n    return inorderTraversal(root.left) + [root.val] + inorderTraversal(root.right)",
        timeComplexity: "O(n)",
        spaceComplexity: "O(h)",
        algorithm: "Recursive DFS",
        isPrimary: true,
        verified: true
      },
      {
        problemId: "validate-bst",
        language: "python",
        code: "def isValidBST(root):\n    def validate(node, low, high):\n        if not node:\n            return True\n        if node.val <= low or node.val >= high:\n            return False\n        return validate(node.left, low, node.val) and validate(node.right, node.val, high)\n    return validate(root, float('-inf'), float('inf'))",
        timeComplexity: "O(n)",
        spaceComplexity: "O(h)",
        algorithm: "DFS with bounds",
        isPrimary: true,
        verified: true
      },
      {
        problemId: "number-of-islands",
        language: "python",
        code: "def numIslands(grid):\n    if not grid:\n        return 0\n    count = 0\n    for i in range(len(grid)):\n        for j in range(len(grid[0])):\n            if grid[i][j] == '1':\n                dfs(grid, i, j)\n                count += 1\n    return count\n\ndef dfs(grid, i, j):\n    if i < 0 or i >= len(grid) or j < 0 or j >= len(grid[0]) or grid[i][j] != '1':\n        return\n    grid[i][j] = '0'\n    dfs(grid, i+1, j)\n    dfs(grid, i-1, j)\n    dfs(grid, i, j+1)\n    dfs(grid, i, j-1)",
        timeComplexity: "O(m*n)",
        spaceComplexity: "O(m*n)",
        algorithm: "DFS flood fill",
        isPrimary: true,
        verified: true
      },
      {
        problemId: "course-schedule",
        language: "python",
        code: "def canFinish(numCourses, prerequisites):\n    graph = [[] for _ in range(numCourses)]\n    for course, prereq in prerequisites:\n        graph[course].append(prereq)\n    visited = [0] * numCourses\n    \n    def dfs(node):\n        if visited[node] == 1:\n            return False\n        if visited[node] == 2:\n            return True\n        visited[node] = 1\n        for neighbor in graph[node]:\n            if not dfs(neighbor):\n                return False\n        visited[node] = 2\n        return True\n    \n    for i in range(numCourses):\n        if not dfs(i):\n            return False\n    return True",
        timeComplexity: "O(V + E)",
        spaceComplexity: "O(V + E)",
        algorithm: "DFS cycle detection",
        isPrimary: true,
        verified: true
      },
      {
        problemId: "merge-k-sorted-lists",
        language: "python",
        code: "import heapq\n\ndef mergeKLists(lists):\n    heap = []\n    for i, l in enumerate(lists):\n        if l:\n            heapq.heappush(heap, (l.val, i, l))\n    dummy = ListNode(0)\n    curr = dummy\n    while heap:\n        val, i, node = heapq.heappop(heap)\n        curr.next = node\n        curr = curr.next\n        if node.next:\n            heapq.heappush(heap, (node.next.val, i, node.next))\n    return dummy.next",
        timeComplexity: "O(N log k)",
        spaceComplexity: "O(k)",
        algorithm: "Min-heap merge",
        isPrimary: true,
        verified: true
      },
      {
        problemId: "word-break",
        language: "python",
        code: "def wordBreak(s, wordDict):\n    wordSet = set(wordDict)\n    dp = [False] * (len(s) + 1)\n    dp[0] = True\n    for i in range(1, len(s) + 1):\n        for j in range(i):\n            if dp[j] and s[j:i] in wordSet:\n                dp[i] = True\n                break\n    return dp[len(s)]",
        timeComplexity: "O(n² * m)",
        spaceComplexity: "O(n)",
        algorithm: "Dynamic programming",
        isPrimary: true,
        verified: true
      },
      {
        problemId: "lru-cache",
        language: "python",
        code: "class LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.cache = {}\n        self.order = []\n    \n    def get(self, key):\n        if key in self.cache:\n            self.order.remove(key)\n            self.order.append(key)\n            return self.cache[key]\n        return -1\n    \n    def put(self, key, value):\n        if key in self.cache:\n            self.order.remove(key)\n        elif len(self.cache) >= self.capacity:\n            oldest = self.order.pop(0)\n            del self.cache[oldest]\n        self.cache[key] = value\n        self.order.append(key)",
        timeComplexity: "O(n)",
        spaceComplexity: "O(capacity)",
        algorithm: "HashMap + List",
        isPrimary: true,
        verified: true
      },
      {
        problemId: "trapping-rain-water",
        language: "python",
        code: "def trap(height):\n    if not height:\n        return 0\n    left, right = 0, len(height) - 1\n    leftMax, rightMax = height[left], height[right]\n    water = 0\n    while left < right:\n        if leftMax < rightMax:\n            left += 1\n            leftMax = max(leftMax, height[left])\n            water += leftMax - height[left]\n        else:\n            right -= 1\n            rightMax = max(rightMax, height[right])\n            water += rightMax - height[right]\n    return water",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        algorithm: "Two pointers",
        isPrimary: true,
        verified: true
      },
      {
        problemId: "n-queens",
        language: "python",
        code: "def solveNQueens(n):\n    def backtrack(row, cols, diag1, diag2, board):\n        if row == n:\n            result.append([''.join(r) for r in board])\n            return\n        for col in range(n):\n            if col in cols or row - col in diag1 or row + col in diag2:\n                continue\n            board[row][col] = 'Q'\n            backtrack(row + 1, cols | {col}, diag1 | {row - col}, diag2 | {row + col}, board)\n            board[row][col] = '.'\n    \n    result = []\n    backtrack(0, set(), set(), set(), [['.' for _ in range(n)] for _ in range(n)])\n    return result",
        timeComplexity: "O(n!)",
        spaceComplexity: "O(n²)",
        algorithm: "Backtracking",
        isPrimary: true,
        verified: true
      },
      {
        problemId: "median-of-two-sorted-arrays",
        language: "python",
        code: "def findMedianSortedArrays(nums1, nums2):\n    if len(nums1) > len(nums2):\n        nums1, nums2 = nums2, nums1\n    x, y = len(nums1), len(nums2)\n    low, high = 0, x\n    while low <= high:\n        partitionX = (low + high) // 2\n        partitionY = (x + y + 1) // 2 - partitionX\n        maxX = float('-inf') if partitionX == 0 else nums1[partitionX - 1]\n        minX = float('inf') if partitionX == x else nums1[partitionX]\n        maxY = float('-inf') if partitionY == 0 else nums2[partitionY - 1]\n        minY = float('inf') if partitionY == y else nums2[partitionY]\n        if maxX <= minY and maxY <= minX:\n            if (x + y) % 2 == 0:\n                return (max(maxX, maxY) + min(minX, minY)) / 2\n            else:\n                return max(maxX, maxY)\n        elif maxX > minY:\n            high = partitionX - 1\n        else:\n            low = partitionX + 1",
        timeComplexity: "O(log(min(m,n)))",
        spaceComplexity: "O(1)",
        algorithm: "Binary search",
        isPrimary: true,
        verified: true
      }
    ];

    let createdRefs = 0;
    for (const ref of refSolutions) {
      const existing = await ReferenceSolution.findOne({ problemId: ref.problemId, language: ref.language });
      if (!existing) {
        await ReferenceSolution.create(ref);
        createdRefs++;
      }
    }
    console.log(`  Created ${createdRefs} reference solutions`);

    // 2b. Create/update problems with oracleSolutions
    console.log("\n[2b/9] Creating problems with oracle solutions...");
    const oracleSolutionsMap = {};
    for (const ref of refSolutions) {
      if (ref.isPrimary) oracleSolutionsMap[ref.problemId] = ref;
    }
    let createdProblems = 0;
    let updatedProblems = 0;
    for (const p of newProblems) {
      const existing = await Problem.findOne({ problemId: p.problemId });
      if (!existing) {
        const oracle = oracleSolutionsMap[p.problemId];
        await Problem.create({
          ...p,
          oracleSolutions: oracle ? { python: oracle.code, javascript: "", cpp: "" } : undefined,
        });
        createdProblems++;
      } else if (!existing.oracleSolutions?.python) {
        const oracle = oracleSolutionsMap[p.problemId];
        if (oracle) {
          await Problem.updateOne(
            { _id: existing._id },
            { $set: { oracleSolutions: { python: oracle.code, javascript: "", cpp: "" } } }
          );
          updatedProblems++;
        }
      }
    }
    console.log(`  Created ${createdProblems} new problems, updated ${updatedProblems} with oracleSolutions`);

    // Fetch all problems after creating new ones
    const problems = await Problem.find({});

    // 3. Enroll students in courses
    console.log("\n[3/9] Creating enrollments...");
    let enrollments = 0;
    for (const student of students) {
      for (const course of courses) {
        const existing = await Enrollment.findOne({ userId: student._id, courseId: course._id });
        if (!existing) {
          await Enrollment.create({
            userId: student._id,
            courseId: course._id,
            enrolledAt: randomDate(new Date('2024-01-01'), new Date('2024-06-01')),
            progress: randomInt(10, 80)
          });
          enrollments++;
        }
      }
    }
    console.log(`  Created ${enrollments} enrollments`);

    // 4. Create sessions and submissions
    console.log("\n[4/9] Creating sessions and submissions...");
    let sessions = 0;
    let submissions = 0;
    const sessionVerdicts = ["pass", "fail", "abandoned", "max_attempts_reached"];
    const submissionVerdicts = ["pass", "fail", "compile_error", "timeout"];
    const languages = ["python", "javascript", "cpp"];
    
    console.log(`  Students: ${students.length}, Problems: ${problems.length}`);
    
    for (const student of students) {
      // Each student attempts 3-7 random problems
      const numProblems = randomInt(3, Math.min(7, problems.length));
      const attemptedProblems = [...problems].sort(() => Math.random() - 0.5).slice(0, numProblems);
      
      for (const problem of attemptedProblems) {
        const sessionId = `session_${student._id}_${problem.problemId}_${Date.now()}`;
        const numRounds = randomInt(1, 4);
        const finalVerdict = random(sessionVerdicts);
        
        const session = await Session.create({
          sessionId,
          userId: student._id,
          problemId: problem.problemId,
          startedAt: randomDate(new Date('2024-01-01'), new Date('2024-06-01')),
          endedAt: randomDate(new Date('2024-06-01'), new Date('2024-07-01')),
          roundCount: numRounds,
          finalVerdict
        });
        sessions++;
        
        // Create submissions for each round
        for (let round = 1; round <= numRounds; round++) {
          const language = random(languages);
          const isLastRound = round === numRounds;
          const submissionVerdict = isLastRound
            ? (finalVerdict === "pass" ? "pass" : random(["fail", "compile_error", "timeout"]))
            : random(submissionVerdicts);
          
          await Submission.create({
            userId: student._id,
            problemId: problem.problemId,
            sessionId,
            code: `# Solution for ${problem.title}\ndef solve():\n    pass`,
            language,
            round,
            verdict: submissionVerdict,
            tier: 1,
            hiddenTestResults: {
              passed: submissionVerdict === "pass" ? randomInt(5, 10) : randomInt(0, 4),
              failed: submissionVerdict === "pass" ? 0 : randomInt(1, 5),
              total: randomInt(5, 10)
            },
            aiAnalysis: {
              agent: random(["tutor", "codeReview", "compiler"]),
              confidence: randomInt(60, 95),
              response: `Analysis for ${problem.title} attempt ${round}`
            },
            executionMode: random(["run", "samples", "submit"]),
            createdAt: randomDate(new Date('2024-01-01'), new Date('2024-06-01'))
          });
          submissions++;
        }
      }
    }
    console.log(`  Created ${sessions} sessions and ${submissions} submissions`);

    // 5. Create AI conversations
    console.log("\n[5/9] Creating AI conversations...");
    let conversations = 0;
    const topics = ["general", "data-structures", "algorithms", "dynamic-programming", "trees", "graphs"];
    const styles = ["beginner", "intermediate", "expert", "socratic", "step_by_step"];
    
    for (const student of students) {
      const numConversations = randomInt(2, 5);
      for (let i = 0; i < numConversations; i++) {
        const problem = random(problems);
        const sessionId = `ai_session_${student._id}_${i}`;
        
        await AIConversation.create({
          userId: student._id,
          sessionId,
          topic: random(topics),
          messages: [
            { role: "user", content: "Can you help me understand this problem?" },
            { role: "assistant", content: "Of course! Let me guide you through the key concepts." },
            { role: "user", content: "I'm stuck on the edge cases." },
            { role: "assistant", content: "Think about what happens when the input is empty or has only one element." }
          ],
          metadata: {
            problemId: problem.problemId,
            preferredStyle: random(styles)
          },
          active: Math.random() > 0.3,
          createdAt: randomDate(new Date('2024-01-01'), new Date('2024-06-01'))
        });
        conversations++;
      }
    }
    console.log(`  Created ${conversations} AI conversations`);

    // 6. Create AI usage logs
    console.log("\n[6/9] Creating AI usage logs...");
    let usageLogs = 0;
    const actions = ["chat", "code-review", "hint", "quiz", "explain", "debug"];
    const agentTypes = ["tutor", "codeReview", "hint", "compiler", "quiz"];
    
    for (let i = 0; i < 100; i++) {
      const user = random(users);
      const problem = random(problems);
      
      await AIUsage.create({
        userId: user._id,
        role: user.role,
        action: random(actions),
        agentType: random(agentTypes),
        model: config.llm.model,
        promptTokens: randomInt(100, 1000),
        completionTokens: randomInt(50, 500),
        totalTokens: randomInt(150, 1500),
        latencyMs: randomInt(500, 3000),
        success: Math.random() > 0.1,
        cached: Math.random() > 0.7,
        problemId: problem.problemId,
        createdAt: randomDate(new Date('2024-01-01'), new Date('2024-06-01'))
      });
      usageLogs++;
    }
    console.log(`  Created ${usageLogs} AI usage logs`);

    // 7. Create learning paths
    console.log("\n[7/9] Creating learning paths...");
    let learningPaths = 0;
    const weakTopics = ["dynamic-programming", "graph-algorithms", "tree-traversal", "binary-search", "recursion"];
    const strongTopics = ["arrays", "strings", "hashmaps", "sorting", "basic-algorithms"];
    const recommendationTypes = ["next_topic", "revision", "practice", "challenge"];
    
    for (const student of students) {
      const existing = await LearningPath.findOne({ userId: student._id });
      if (!existing) {
        const numWeak = randomInt(1, 3);
        const numStrong = randomInt(1, 3);
        
        await LearningPath.create({
          userId: student._id,
          weakAreas: weakTopics.slice(0, numWeak).map(topic => ({
            topic,
            pattern: random(["conceptual", "implementation", "optimization"]),
            frequency: randomInt(1, 5),
            lastDetected: randomDate(new Date('2024-01-01'), new Date('2024-06-01')),
            suggestedPractice: [random(problems).problemId]
          })),
          strengths: strongTopics.slice(0, numStrong),
          recommendations: [
            {
              type: random(recommendationTypes),
              problemId: random(problems).problemId,
              reason: "Based on your recent performance",
              priority: randomInt(60, 90),
              completed: Math.random() > 0.5
            }
          ],
          lastAnalyzed: randomDate(new Date('2024-05-01'), new Date('2024-06-01'))
        });
        learningPaths++;
      }
    }
    console.log(`  Created ${learningPaths} learning paths`);

    // 8. Create notifications
    console.log("\n[8/9] Creating notifications...");
    let notifications = 0;
    const notificationTypes = ["broadcast", "info", "warning", "announcement"];
    const notificationTitles = {
      broadcast: ["Platform Update", "New Feature Available", "System Notice"],
      info: ["Course Update", "New Module Added", "Practice Reminder"],
      warning: ["Account Notice", "Usage Alert", "System Alert"],
      announcement: ["New Course Launch", "Feature Announcement", "Community Update"]
    };
    const audiences = ["all", "students", "instructors", "admins"];
    
    for (const user of users) {
      const numNotifications = randomInt(2, 5);
      for (let i = 0; i < numNotifications; i++) {
        const type = random(notificationTypes);
        await Notification.create({
          type,
          title: random(notificationTitles[type]),
          message: `This is a ${type} notification for ${user.displayName}`,
          audience: random(audiences),
          link: "/dashboard",
          createdBy: admins[0]?._id,
          active: Math.random() > 0.2,
          createdAt: randomDate(new Date('2024-01-01'), new Date('2024-06-01'))
        });
        notifications++;
      }
    }
    console.log(`  Created ${notifications} notifications`);

    // 9. Create audit logs
    console.log("\n[9/9] Creating audit logs...");
    let auditLogs = 0;
    const auditActions = ["login", "logout", "create", "update", "delete", "view"];
    const auditResources = ["user", "course", "problem", "submission", "settings"];
    
    for (let i = 0; i < 50; i++) {
      const user = random(users);
      const action = random(auditActions);
      const resource = random(auditResources);
      
      await AuditLog.create({
        userId: user._id,
        action,
        resource,
        resourceId: `${resource}_${randomInt(1, 100)}`,
        ip: `192.168.1.${randomInt(1, 254)}`,
        userAgent: "Mozilla/5.0",
        success: Math.random() > 0.1,
        metadata: { details: `${action} on ${resource}` }
      });
      auditLogs++;
    }
    console.log(`  Created ${auditLogs} audit logs`);

    console.log("\n[COMPLETE] Comprehensive seed data created successfully!");
    console.log(`  - ${createdProblems} new problems`);
    console.log(`  - ${createdRefs} reference solutions`);
    console.log(`  - ${enrollments} enrollments`);
    console.log(`  - ${sessions} sessions`);
    console.log(`  - ${submissions} submissions`);
    console.log(`  - ${conversations} AI conversations`);
    console.log(`  - ${usageLogs} AI usage logs`);
    console.log(`  - ${learningPaths} learning paths`);
    console.log(`  - ${notifications} notifications`);
    console.log(`  - ${auditLogs} audit logs`);

  } catch (err) {
    console.error("Error:", err.message);
    console.error(err.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedComprehensive();