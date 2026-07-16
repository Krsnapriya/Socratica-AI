// Seed Analysis Patterns — populates AnalysisPattern collection.
const AnalysisPattern = require("./models/AnalysisPattern");

const DEFAULT_PATTERNS = [
  // Time Complexity
  { type: "timeComplexity", name: "nested_loops", regex: "for.*\\n.*for|while.*\\n.*while", complexity: "O(n^2)", severity: "medium", description: "Nested loops detected" },
  { type: "timeComplexity", name: "triple_nested", regex: "for.*\\n.*for.*\\n.*for", complexity: "O(n^3)", severity: "high", description: "Triple nested loop" },
  { type: "timeComplexity", name: "binary_search", regex: "mid.*=.*\\(.*\\+.*\\).*\\/.*2|binary.*search", complexity: "O(log n)", severity: "low", description: "Binary search pattern" },
  { type: "timeComplexity", name: "sort_call", regex: "\\.sort\\(|Arrays\\.sort|std::sort", complexity: "O(n log n)", severity: "low", description: "Sort function call" },
  { type: "timeComplexity", name: "recursion_no_memo", regex: "def.*\\(.*\\):\\s*\\n.*\\1\\(", complexity: "O(2^n)", severity: "high", description: "Recursion without memoization" },

  // Bug Patterns
  { type: "bug", name: "off_by_one", regex: "range\\(.*len.*-.*1\\)|<.*len\\(.*\\)\\s*-\\s*1", severity: "medium", description: "Possible off-by-one error" },
  { type: "bug", name: "empty_return", regex: "return\\s*$|return\\s+None", severity: "low", description: "Empty return (may miss edge case)" },
  { type: "bug", name: "infinite_loop", regex: "while\\s+True:", severity: "medium", description: "Infinite loop risk" },
  { type: "bug", name: "global_mutation", regex: "global\\s+|nonlocal\\s+", severity: "medium", description: "Global variable mutation" },

  // Code Smells
  { type: "codeSmell", name: "long_function", regex: "def\\s+\\w+.*:\\s*\\n(?:.*\\n){20,}", severity: "low", description: "Function over 20 lines" },
  { type: "codeSmell", name: "magic_number", regex: "(?<!\\w)\\d{3,}(?!\\w)", severity: "low", description: "Magic number detected" },
  { type: "codeSmell", name: "deep_nesting", regex: "if.*:\\s*\\n.*if.*:\\s*\\n.*if.*:", severity: "medium", description: "Deep nesting (3+ levels)" },
  { type: "codeSmell", name: "duplicate_code", regex: "(.{20,})\\n.*\\1", severity: "medium", description: "Possible duplicate code lines" },
];

async function seedAnalysisPatterns() {
  let created = 0;
  let updated = 0;

  for (const pattern of DEFAULT_PATTERNS) {
    const existing = await AnalysisPattern.findOne({ type: pattern.type, name: pattern.name });
    if (existing) {
      await AnalysisPattern.updateOne(
        { type: pattern.type, name: pattern.name },
        { $set: pattern }
      );
      updated++;
    } else {
      await AnalysisPattern.create(pattern);
      created++;
    }
  }

  console.log(`[seedAnalysisPatterns] Created: ${created}, Updated: ${updated}`);
  return { created, updated };
}

module.exports = seedAnalysisPatterns;
