// Code Analyzer — detects complexity, bugs, and code smells in student code.
// Reads patterns from DB (AnalysisPattern collection) with fallback to hardcoded defaults.

// ── Hardcoded defaults ──────────────────────────────────────────────────
const DEFAULT_TIME_COMPLEXITY = {
  nested_loop: { pattern: /for\s.*\n\s*for\s|while\s.*\n\s*while|for\s.*\n\s*while|while\s.*\n\s*for/, complexity: "O(n²)", description: "Nested loops detected" },
  single_loop: { pattern: /for\s|while\s/, complexity: "O(n)", description: "Single loop" },
  binary_search: { pattern: /while.*<.*\/\s*2|binary.*search|mid\s*=|lo.*hi|left.*right/, complexity: "O(log n)", description: "Binary search pattern" },
  hash_lookup: { pattern: /dict\(|HashMap|Map\(\)|{}|in\s+\w+|\.has\(|\.get\(|\[.*\]\s*\.\s*includes/, complexity: "O(1) average", description: "Hash-based lookup" },
  sort_then_scan: { pattern: /sort\(|\.sort\(|sorted\(|\.\s*sort\(\)|qsort|merge.*sort/, complexity: "O(n log n)", description: "Sorting detected" },
  two_pointer: { pattern: /left.*right|two.*pointer|start.*end|low.*high/, complexity: "O(n)", description: "Two pointer technique" },
  recursion_no_memo: { pattern: /def\s+(\w+).*\n.*\1\(|function\s+(\w+).*\n.*\1\(|void\s+(\w+).*\n.*\1\(/, complexity: "O(2^n)", description: "Recursion without memoization (potential exponential)" },
  recursion_with_memo: { pattern: /@lru_cache|@cache|memo|dp\[|memoize/, complexity: "O(n)", description: "Recursion with memoization" },
  dp_table: { pattern: /dp\s*=\s*\[|dp\s*=\s*\{|dp\s*=\s*Array|memo\s*=\s*[\[{]/, complexity: "O(n²) or O(n)", description: "Dynamic programming table" },
};

const DEFAULT_BUG_PATTERNS = {
  infinite_loop: { pattern: /while\s+True|while\s+1|for\s+_\s+in\s+range\s*\(\s*\)/, severity: "high", message: "Possible infinite loop detected" },
  unused_variable: { pattern: /(\w+)\s*=\s*.*\n(?:(?!\1).)*$/m, severity: "low", message: "Variable may be assigned but never used" },
  index_out_of_bounds: { pattern: /\[\s*len\s*\(|\[\s*-1\s*\]|\[\s*-\d+\s*\]/, severity: "medium", message: "Potential index out of bounds access" },
  integer_overflow: { pattern: /\*\*.*\d{10,}|\*\s+\d{5,}/, severity: "medium", message: "Large number multiplication may cause overflow" },
  empty_return: { pattern: /return\s*$|return\s+None$|return\s+null$|return\s+undefined$/, severity: "low", message: "Function may return None/null unexpectedly" },
  mutation_in_loop: { pattern: /\.append\(|\.push\(|\.extend\(|\.concat\(/, severity: "low", message: "List mutation in loop - verify this is intentional" },
  shadow_builtin: { pattern: /\b(list|dict|set|int|str|float|print|input|type|id|hash|map|filter|range)\s*=/, severity: "low", message: "Built-in name is being shadowed" },
  division_by_zero: { pattern: /\/\s*0|\/\s*len\s*\(|%\s*0/, severity: "high", message: "Potential division by zero" },
  missing_base_case: { pattern: /def\s+(\w+).*\n(?:(?!if\s+.*return).)*\1\(/, severity: "medium", message: "Recursive function may lack base case" },
};

const DEFAULT_CODE_SMELL = {
  long_function: { threshold: 50, message: "Function is very long - consider breaking it into smaller functions" },
  deep_nesting: { threshold: 4, message: "Deeply nested code - consider extracting logic or using early returns" },
  magic_numbers: { pattern: /\b(?:[2-9]\d{2,}|[1-9]\d{3,})\b/, message: "Magic number detected - consider using a named constant" },
  duplicated_logic: { pattern: null, message: "Similar code blocks detected - consider extracting common logic" },
  god_variable: { pattern: /\b(data|result|res|tmp|temp|val|x|y|z|a|b|c)\s*=/, message: "Non-descriptive variable name" },
};

// ── DB cache ────────────────────────────────────────────────────────────
let dbTimePatterns = null;
let dbBugPatterns = null;
let dbSmellPatterns = null;
let dbCacheTimestamp = 0;
const DB_CACHE_TTL = 60000;

async function loadFromDB() {
  const now = Date.now();
  if (dbTimePatterns && now - dbCacheTimestamp < DB_CACHE_TTL) return;

  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      dbCacheTimestamp = now;
      dbTimePatterns = DEFAULT_TIME_COMPLEXITY;
      dbBugPatterns = DEFAULT_BUG_PATTERNS;
      dbSmellPatterns = DEFAULT_CODE_SMELL;
      return;
    }

    const AnalysisPattern = require("../models/AnalysisPattern");
    const patterns = await AnalysisPattern.find({ isActive: true }).lean();

    if (patterns.length === 0) {
      dbCacheTimestamp = now;
      dbTimePatterns = DEFAULT_TIME_COMPLEXITY;
      dbBugPatterns = DEFAULT_BUG_PATTERNS;
      dbSmellPatterns = DEFAULT_CODE_SMELL;
      return;
    }

    const timePatterns = {};
    const bugPatterns = {};
    const smellPatterns = {};

    for (const p of patterns) {
      try {
        const regex = new RegExp(p.regex, "i");
        const entry = { pattern: regex, description: p.description || p.name, severity: p.severity };

        if (p.type === "timeComplexity") {
          entry.complexity = p.complexity || "O(n)";
          timePatterns[p.name] = entry;
        } else if (p.type === "bug") {
          entry.message = p.description || p.name;
          bugPatterns[p.name] = entry;
        } else if (p.type === "codeSmell") {
          entry.message = p.description || p.name;
          smellPatterns[p.name] = entry;
        }
      } catch {
        // Skip invalid regex
      }
    }

    // Merge with defaults
    for (const [k, v] of Object.entries(DEFAULT_TIME_COMPLEXITY)) {
      if (!timePatterns[k]) timePatterns[k] = v;
    }
    for (const [k, v] of Object.entries(DEFAULT_BUG_PATTERNS)) {
      if (!bugPatterns[k]) bugPatterns[k] = v;
    }
    for (const [k, v] of Object.entries(DEFAULT_CODE_SMELL)) {
      if (!smellPatterns[k]) smellPatterns[k] = v;
    }

    dbCacheTimestamp = now;
    dbTimePatterns = timePatterns;
    dbBugPatterns = bugPatterns;
    dbSmellPatterns = smellPatterns;
  } catch {
    dbCacheTimestamp = now;
    dbTimePatterns = DEFAULT_TIME_COMPLEXITY;
    dbBugPatterns = DEFAULT_BUG_PATTERNS;
    dbSmellPatterns = DEFAULT_CODE_SMELL;
  }
}

function getTimePatterns() { return dbTimePatterns || DEFAULT_TIME_COMPLEXITY; }
function getBugPatterns() { return dbBugPatterns || DEFAULT_BUG_PATTERNS; }
function getSmellPatterns() { return dbSmellPatterns || DEFAULT_CODE_SMELL; }

// ── Analysis functions ──────────────────────────────────────────────────

function analyzeComplexity(code, language) {
  const findings = [];
  for (const [name, config] of Object.entries(getTimePatterns())) {
    if (config.pattern && config.pattern.test(code)) {
      findings.push({ type: "complexity", name, ...config });
    }
  }
  return findings;
}

function detectBugs(code, language) {
  const findings = [];
  for (const [name, config] of Object.entries(getBugPatterns())) {
    if (config.pattern && config.pattern.test(code)) {
      findings.push({ type: "bug", name, severity: config.severity, message: config.message });
    }
  }
  return findings;
}

function detectCodeSmells(code, language) {
  const findings = [];
  const lines = code.split("\n");
  const smells = getSmellPatterns();
  const longFunctions = countFunctionLength(code, language);
  for (const fn of longFunctions) {
    if (fn.lines > smells.long_function.threshold) {
      findings.push({ type: "smell", name: "long_function", message: `Function "${fn.name}" is ${fn.lines} lines long. ${smells.long_function.message}` });
    }
  }

  let maxDepth = 0;
  let currentDepth = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("for ") || trimmed.startsWith("while ") || trimmed.startsWith("if ") || trimmed.startsWith("elif ") || trimmed.startsWith("else")) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (trimmed === "" || (!trimmed.startsWith("for ") && !trimmed.startsWith("while ") && !trimmed.startsWith("if ") && !trimmed.startsWith("elif ") && !trimmed.startsWith("else"))) {
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("//") && !trimmed.startsWith("/*")) {
        currentDepth = Math.max(0, currentDepth - 0.1);
      }
    }
  }
  if (maxDepth >= smells.deep_nesting.threshold) {
    findings.push({ type: "smell", name: "deep_nesting", message: smells.deep_nesting.message });
  }

  if (smells.magic_numbers.pattern) {
    const matches = code.match(smells.magic_numbers.pattern);
    if (matches) {
      findings.push({ type: "smell", name: "magic_numbers", message: smells.magic_numbers.message });
    }
  }

  return findings;
}

function countFunctionLength(code, language) {
  const functions = [];
  const lines = code.split("\n");
  let inFunction = false;
  let funcName = "";
  let funcStart = 0;
  let indent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    let match;
    if (language === "python") {
      match = trimmed.match(/^def\s+(\w+)/);
    } else if (language === "javascript") {
      match = trimmed.match(/^(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\())|(?:async\s+)?function\s+(\w+)/);
    } else if (language === "cpp") {
      match = trimmed.match(/^(?:int|void|bool|string|auto|vector|long|double|float|char)\s+(\w+)\s*\(/);
    }

    if (match) {
      if (inFunction && i - funcStart > 1) {
        functions.push({ name: funcName, lines: i - funcStart });
      }
      inFunction = true;
      funcName = match[1] || match[2] || match[3] || "anonymous";
      funcStart = i;
      indent = line.length - line.trimStart().length;
    }
  }

  if (inFunction) {
    functions.push({ name: funcName, lines: lines.length - funcStart });
  }

  return functions;
}

function analyzeStudentCode(code, language) {
  return {
    complexity: analyzeComplexity(code, language),
    bugs: detectBugs(code, language),
    smells: detectCodeSmells(code, language),
    linesOfCode: code.split("\n").length,
    hasMain: language === "cpp" ? code.includes("int main") : true,
    usesRecursion: /\bdef\s+(\w+).*\n.*\1\(|function\s+(\w+).*\n.*\1\(/.test(code),
    usesMemoization: /@lru_cache|@cache|memo|dp\[/.test(code),
  };
}

module.exports = {
  loadFromDB,
  analyzeStudentCode,
  analyzeComplexity,
  detectBugs,
  detectCodeSmells,
  DEFAULT_TIME_COMPLEXITY,
  DEFAULT_BUG_PATTERNS,
  DEFAULT_CODE_SMELL,
};
