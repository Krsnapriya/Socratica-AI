// Seed Topics — populates Topic collection with knowledge graph.
const Topic = require("./models/Topic");

const DEFAULT_TOPICS = [
  // Fundamentals
  { name: "arrays", category: "fundamentals", dependsOn: [] },
  { name: "hashing", category: "fundamentals", dependsOn: ["arrays"] },
  { name: "two_pointers", category: "fundamentals", dependsOn: ["arrays"] },
  { name: "sliding_window", category: "fundamentals", dependsOn: ["arrays", "two_pointers"] },
  { name: "strings", category: "fundamentals", dependsOn: ["arrays"] },
  { name: "string_manipulation", category: "fundamentals", dependsOn: ["strings", "hashing"] },
  { name: "math", category: "fundamentals", dependsOn: [] },
  { name: "functions", category: "fundamentals", dependsOn: [] },

  // Searching & Sorting
  { name: "binary_search", category: "searching", dependsOn: ["arrays"] },
  { name: "sorting", category: "searching", dependsOn: ["arrays"] },
  { name: "merge_sort", category: "searching", dependsOn: ["sorting", "recursion"] },
  { name: "quick_sort", category: "searching", dependsOn: ["sorting", "recursion"] },

  // Algorithms
  { name: "recursion", category: "algorithms", dependsOn: ["functions"] },
  { name: "memoization", category: "algorithms", dependsOn: ["recursion", "hashing"] },
  { name: "dynamic_programming", category: "algorithms", dependsOn: ["recursion", "memoization"] },
  { name: "tabulation", category: "algorithms", dependsOn: ["dynamic_programming"] },
  { name: "greedy", category: "algorithms", dependsOn: ["sorting", "dynamic_programming"] },
  { name: "backtracking", category: "algorithms", dependsOn: ["recursion"] },

  // Data Structures
  { name: "stacks", category: "data_structures", dependsOn: ["arrays"] },
  { name: "queues", category: "data_structures", dependsOn: ["arrays"] },
  { name: "linked_lists", category: "data_structures", dependsOn: ["recursion"] },
  { name: "trees", category: "data_structures", dependsOn: ["recursion", "queues"] },
  { name: "binary_search_trees", category: "data_structures", dependsOn: ["trees", "binary_search"] },
  { name: "heaps", category: "data_structures", dependsOn: ["trees"] },
  { name: "graphs", category: "data_structures", dependsOn: ["trees", "hashing"] },

  // Graph Algorithms
  { name: "bfs", category: "graph_algorithms", dependsOn: ["graphs", "queues"] },
  { name: "dfs", category: "graph_algorithms", dependsOn: ["graphs", "recursion"] },
  { name: "dijkstra", category: "graph_algorithms", dependsOn: ["graphs", "heaps"] },

  // Math
  { name: "bit_manipulation", category: "math", dependsOn: ["math"] },
  { name: "number_theory", category: "math", dependsOn: ["math"] },

  // Advanced
  { name: "union_find", category: "advanced", dependsOn: ["hashing", "graphs"] },
  { name: "trie", category: "advanced", dependsOn: ["strings", "trees"] },
  { name: "segment_tree", category: "advanced", dependsOn: ["trees", "binary_search"] },
];

async function seedTopics() {
  let created = 0;
  let updated = 0;

  for (const topic of DEFAULT_TOPICS) {
    const existing = await Topic.findOne({ name: topic.name });
    if (existing) {
      await Topic.updateOne({ name: topic.name }, { $set: topic });
      updated++;
    } else {
      await Topic.create(topic);
      created++;
    }
  }

  console.log(`[seedTopics] Created: ${created}, Updated: ${updated}`);
  return { created, updated };
}

module.exports = seedTopics;
