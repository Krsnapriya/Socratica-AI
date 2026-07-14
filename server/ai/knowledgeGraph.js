// Knowledge Graph — topic prerequisite relationships
// Used by memory agent to identify prerequisite gaps

const PREREQUISITES = {
  // Arrays & Hashing
  "arrays": { dependsOn: [], category: "fundamentals" },
  "hashing": { dependsOn: ["arrays"], category: "fundamentals" },
  "two_pointers": { dependsOn: ["arrays"], category: "fundamentals" },
  "sliding_window": { dependsOn: ["arrays", "two_pointers"], category: "fundamentals" },

  // Searching & Sorting
  "binary_search": { dependsOn: ["arrays"], category: "searching" },
  "sorting": { dependsOn: ["arrays"], category: "searching" },
  "merge_sort": { dependsOn: ["sorting", "recursion"], category: "searching" },
  "quick_sort": { dependsOn: ["sorting", "recursion"], category: "searching" },

  // Recursion & DP
  "recursion": { dependsOn: ["functions"], category: "algorithms" },
  "memoization": { dependsOn: ["recursion", "hashing"], category: "algorithms" },
  "dynamic_programming": { dependsOn: ["recursion", "memoization"], category: "algorithms" },
  "tabulation": { dependsOn: ["dynamic_programming"], category: "algorithms" },

  // Trees & Graphs
  "stacks": { dependsOn: ["arrays"], category: "data_structures" },
  "queues": { dependsOn: ["arrays"], category: "data_structures" },
  "linked_lists": { dependsOn: ["recursion"], category: "data_structures" },
  "trees": { dependsOn: ["recursion", "queues"], category: "data_structures" },
  "binary_search_trees": { dependsOn: ["trees", "binary_search"], category: "data_structures" },
  "heaps": { dependsOn: ["trees"], category: "data_structures" },
  "graphs": { dependsOn: ["trees", "hashing"], category: "data_structures" },
  " bfs": { dependsOn: ["graphs", "queues"], category: "graph_algorithms" },
  "dfs": { dependsOn: ["graphs", "recursion"], category: "graph_algorithms" },
  "dijkstra": { dependsOn: ["graphs", "heaps"], category: "graph_algorithms" },

  // Strings
  "strings": { dependsOn: ["arrays"], category: "fundamentals" },
  "string_manipulation": { dependsOn: ["strings", "hashing"], category: "fundamentals" },

  // Math
  "math": { dependsOn: [], category: "fundamentals" },
  "bit_manipulation": { dependsOn: ["math"], category: "math" },
  "number_theory": { dependsOn: ["math"], category: "math" },

  // Greedy
  "greedy": { dependsOn: ["sorting", "dynamic_programming"], category: "algorithms" },

  // Backtracking
  "backtracking": { dependsOn: ["recursion"], category: "algorithms" },

  // Advanced
  "union_find": { dependsOn: ["hashing", "graphs"], category: "advanced" },
  "trie": { dependsOn: ["strings", "trees"], category: "advanced" },
  "segment_tree": { dependsOn: ["trees", "binary_search"], category: "advanced" },
};

// Map problem categories to required topics
const PROBLEM_TOPIC_MAP = {
  "Arrays & Hashing": ["arrays", "hashing"],
  "Two Pointers": ["arrays", "two_pointers"],
  "Searching & Sorting": ["arrays", "binary_search", "sorting"],
  "Dynamic Programming": ["recursion", "memoization", "dynamic_programming"],
  "Math & DP": ["math", "dynamic_programming"],
  "Stacks & Linked Lists": ["stacks", "linked_lists"],
  "Greedy Algorithms": ["sorting", "greedy"],
};

function getPrerequisites(topic) {
  const node = PREREQUISITES[topic];
  return node ? node.dependsOn : [];
}

function getTransitivePrerequisites(topic, visited = new Set()) {
  if (visited.has(topic)) return [];
  visited.add(topic);
  const direct = getPrerequisites(topic);
  const all = [...direct];
  for (const dep of direct) {
    all.push(...getTransitivePrerequisites(dep, visited));
  }
  return [...new Set(all)];
}

function getCategoryForTopic(topic) {
  const node = PREREQUISITES[topic];
  return node ? node.category : "unknown";
}

function getTopicsForProblem(problemCategory) {
  return PROBLEM_TOPIC_MAP[problemCategory] || [];
}

function identifyPrerequisiteGaps(weakTopics, problemCategory) {
  const requiredTopics = getTopicsForProblem(problemCategory);
  const allPrereqs = new Set();
  for (const topic of requiredTopics) {
    getTransitivePrerequisites(topic).forEach(p => allPrereqs.add(p));
  }
  const gaps = [];
  for (const prereq of allPrereqs) {
    if (weakTopics.includes(prereq)) gaps.push(prereq);
  }
  return gaps;
}

function suggestNextTopic(masteredTopics, allTopics = Object.keys(PREREQUISITES)) {
  for (const topic of allTopics) {
    if (masteredTopics.includes(topic)) continue;
    const prereqs = getPrerequisites(topic);
    if (prereqs.every(p => masteredTopics.includes(p))) return topic;
  }
  return null;
}

module.exports = {
  PREREQUISITES,
  PROBLEM_TOPIC_MAP,
  getPrerequisites,
  getTransitivePrerequisites,
  getCategoryForTopic,
  getTopicsForProblem,
  identifyPrerequisiteGaps,
  suggestNextTopic,
};
