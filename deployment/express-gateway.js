const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const Redis = require("ioredis");
const Docker = require("dockerode");
const cookieParser = require("cookie-parser");
const { z } = require("zod");
const jwt = require("jsonwebtoken");
const RateLimit = require("express-rate-limit");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// CORS — allow frontend served from any origin during dev
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Serve static frontend (prefer client/dist if built, otherwise refactored/)
const clientDistPath = path.join(__dirname, "../client/dist");
const refactoredPath = path.join(__dirname, "../refactored");
const staticDir = fs.existsSync(clientDistPath) ? clientDistPath : refactoredPath;
app.use(express.static(staticDir));

// ── Config ────────────────────────────────────────────────────────────────────
const CONFIG = {
  port: process.env.PORT || 3000,
  sandboxImage: process.env.SANDBOX_IMAGE || "socratica/sandbox:latest",
  mongoUri: process.env.MONGO_URI || "mongodb://mongo:27017/socratica",
  redisUrl: process.env.REDIS_URL || "redis://redis:6379",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  jwtSecret: process.env.JWT_SECRET || "",
  oracleCacheTTL: 86400,
  maxPoolSize: 20,
};

// ── Per-language sandbox limits ───────────────────────────────────────────────
// Single source of truth: shared/language-configs.js
const { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGES, getDockerRunArgs } = require("../shared/language-configs");

const DOCKER_HOST = process.env.DOCKER_HOST || null;
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const docker = DOCKER_HOST
  ? new Docker({ host: DOCKER_HOST.split(":")[0], port: parseInt(DOCKER_HOST.split(":")[1]) || 2375 })
  : new Docker({ socketPath: DOCKER_SOCKET });
let redis;
let server;

function getRedis() {
  if (!redis) {
    redis = new Redis(CONFIG.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }
  return redis;
}

// ── Token Blacklist (fail-closed) ──────────────────────────────────────────────
const redisBlacklistPrefix = "blacklist:";
async function isTokenRevoked(jti) {
  try {
    const val = await getRedis().get(`${redisBlacklistPrefix}${jti}`);
    return val === "1";
  } catch (err) {
    console.error("[tokenBlacklist] Redis unavailable:", err.message);
    throw new Error("Token validation unavailable");
  }
}

// ── Auth Middleware ────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, CONFIG.jwtSecret);
  } catch (err) {
    return res.status(401).json({ error: "Request is not authorized" });
  }

  const jti = decoded.jti || token;
  isTokenRevoked(jti).then((revoked) => {
    if (revoked) {
      return res.status(401).json({ error: "Token has been revoked. Please log in again." });
    }
    req.userId = decoded.userId;
    req.userObjectId = new mongoose.Types.ObjectId(req.userId);
    req.userRole = decoded.role || "student";
    req.tokenExp = decoded.exp;
    req.tokenJti = jti;
    next();
  }).catch((err) => {
    console.warn("[requireAuth] Token blacklist unavailable — allowing request:", err.message);
    req.userId = decoded.userId;
    req.userObjectId = new mongoose.Types.ObjectId(req.userId);
    req.userRole = decoded.role || "student";
    req.tokenExp = decoded.exp;
    req.tokenJti = jti;
    next();
  });
}

// ── Role Middleware ────────────────────────────────────────────────────────────
function requireRole(allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (req.userRole === "guest" && !allowedRoles.includes("guest")) {
        return res.status(401).json({ error: "Please sign in to access this resource" });
      }
      if (!allowedRoles.includes(req.userRole)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `Requires one of roles: ${allowedRoles.join(", ")}`,
        });
      }
      next();
    } catch (err) {
      console.error("[requireRole] Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// ── CSRF Protection ────────────────────────────────────────────────────────────
function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  const token = req.headers["x-csrf-token"];
  const cookie = req.cookies?.["_csrf"];
  if (!token || !cookie || token !== cookie) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  next();
}

function csrfTokenSetter(req, res, next) {
  if (!req.cookies?.["_csrf"]) {
    const token = crypto.randomUUID();
    res.cookie("_csrf", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000,
    });
  }
  next();
}

// ── Zod Validation ─────────────────────────────────────────────────────────────
function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors?.map((e) => ({ field: e.path.join("."), message: e.message })) || err.message,
      });
    }
  };
}

const schemas = {
  register: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(12, "Password must be at least 12 characters"),
  }),
  login: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
  }),
  submission: z.object({
    student_code: z.string().min(1, "student_code is required").max(50000, "Code too large"),
    problem_id: z.string().min(1, "problem_id is required"),
    user_id: z.string().optional(),
    language: z.enum(["python", "cpp", "javascript"]).optional(),
    session_id: z.string().optional(),
    round: z.number({ coerce: true }).int().positive().optional(),
  }),
};

// ── Rate Limiter ───────────────────────────────────────────────────────────────
const apiLimiter = RateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const traceLimiter = RateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many trace requests, please slow down." },
});

// ── Mongoose Schemas ──────────────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema({
  sessionId:       { type: String, index: true },
  round:           { type: Number, default: 1 },
  userId:          { type: String, index: true },
  problemId:       { type: String, index: true },
  language:        { type: String, enum: SUPPORTED_LANGUAGES },
  tier:            { type: Number, enum: [1, 2] },
  studentCodeHash: String,
  oracleCodeHash:  String,
  studentTelemetry: Object,
  oracleTelemetry:  Object,
  divergenceStep:  Number,
  divergenceLineno: Number,
  studentLocals:   Object,
  oracleLocals:    Object,
  verdict:         String,   // convergent | divergent | wrong_answer | compile_error | runtime_error | timeout
  aiHint:          String,
  createdAt:       { type: Date, default: Date.now },
});
const Submission = mongoose.model("Submission", submissionSchema);

const oracleSchema = new mongoose.Schema({
  problemId: { type: String, index: true },
  language:  { type: String, enum: SUPPORTED_LANGUAGES, index: true },
  code:      String,
  codeHash:  String,
  updatedAt: { type: Date, default: Date.now },
});
oracleSchema.index({ problemId: 1, language: 1 }, { unique: true });
const Oracle = mongoose.model("Oracle", oracleSchema);

const problemSchema = new mongoose.Schema({
  problemId:   { type: String, unique: true, index: true },
  title:       String,
  description: String,
  difficulty:  String,
  category:    String,
  tags:        [String],
  starterCode: {
    python:     String,
    javascript: String,
    cpp:        String,
  },
});
const Problem = mongoose.model("Problem", problemSchema);

// ── Per-problem test drivers ───────────────────────────────────────────────────
// These are appended to the student's raw function definition so the sandbox
// actually *runs* the code and produces stdout for Tier 2 comparison.
// Oracle code in the DB already includes these calls, so the outputs must match.
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

/**
 * Append test-driver calls to student code so the sandbox actually runs it.
 * Oracle code already has drivers baked in from the seed script.
 */
function injectDriver(studentCode, problemId, language) {
  const drivers = PROBLEM_DRIVERS[problemId];
  if (!drivers) return studentCode;
  const driver = drivers[language] || "";
  if (!driver) return studentCode;
  // Don't inject if the student already has calls (heuristic: code is longer than starter)
  const starterLen = 100; // rough threshold
  if (studentCode.length > starterLen && studentCode.includes("print(") && language === "python") {
    // Student already wrote their own calls — don't double-inject
    return studentCode;
  }
  return studentCode + driver;
}

function demuxDockerStream(buffer) {
  let offset = 0;
  const chunks = [];
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;
    const size = buffer.readUInt32BE(offset + 4);
    if (offset + 8 + size > buffer.length) {
      chunks.push(buffer.subarray(offset + 8));
      break;
    }
    chunks.push(buffer.subarray(offset + 8, offset + 8 + size));
    offset += 8 + size;
  }
  return Buffer.concat(chunks);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function getOracleSolution(problemId, language) {
  const cacheKey = `oracle:${problemId}:${language}`;
  try {
    const cached = await getRedis().get(cacheKey);
    if (cached) return cached;
  } catch {}
  const oracle = await Oracle.findOne({ problemId, language }).lean();
  if (!oracle) return null;
  try { await getRedis().setex(cacheKey, CONFIG.oracleCacheTTL, oracle.code); } catch {}
  return oracle.code;
}

/**
 * Tier determination (CORRECTED per spec §3.2):
 *  - Python only: Tier 1 when step-level alignment is meaningful
 *      → same order of magnitude (log10 ratio < 0.5) AND similar loop depth
 *  - JS / C++: always Tier 2 (no sys.settrace equivalent)
 *  - If student or oracle errored: Tier 2 by default
 */
function evaluateTier(student, oracle, language) {
  // Non-Python → Tier 2 unconditionally
  if (language !== "python") return { tier: 2 };

  // Error on either side → can't do step alignment → Tier 2
  if (student.error || oracle.error) return { tier: 2 };

  const sSteps = student.steps || 0;
  const oSteps = oracle.steps || 0;

  // Avoid log(0)
  if (sSteps === 0 || oSteps === 0) return { tier: 2 };

  const logRatio = Math.abs(Math.log10(sSteps / oSteps));
  const sameOrderOfMagnitude = logRatio < 0.5; // within ~3x

  const sDepth = student.max_loop_depth || 0;
  const oDepth = oracle.max_loop_depth || 0;
  const similarDepth = Math.abs(sDepth - oDepth) <= 1;

  if (sameOrderOfMagnitude && similarDepth) {
    return { tier: 1 };
  }
  return { tier: 2 };
}

/**
 * Walk step snapshots to find first divergence.
 * Returns { divergenceStep, divergenceLineno, studentLocals, oracleLocals }
 */
function findDivergenceStep(student, oracle) {
  const sSnaps = student.snapshots || [];
  const oSnaps = oracle.snapshots || [];
  const limit  = Math.min(sSnaps.length, oSnaps.length);

  for (let i = 0; i < limit; i++) {
    if (JSON.stringify(sSnaps[i].locals) !== JSON.stringify(oSnaps[i].locals)) {
      return {
        divergenceStep:   i + 1,
        divergenceLineno: sSnaps[i].lineno,
        studentLocals:    sSnaps[i].locals,
        oracleLocals:     oSnaps[i].locals,
      };
    }
  }
  return { divergenceStep: null, divergenceLineno: null, studentLocals: null, oracleLocals: null };
}

/**
 * Build a Socratic hint from Gemini.
 * Only called when verdict is not "convergent".
 */
async function getSocraticHint({ problem, studentCode, language, tier, verdict,
                                  divergenceStep, divergenceLineno, studentLocals,
                                  oracleLocals, studentElapsedMs, oracleElapsedMs,
                                  previousHints }) {
  if (!CONFIG.geminiApiKey) return null;

  let { GoogleGenerativeAI } = {};
  try { ({ GoogleGenerativeAI } = require("@google/generative-ai")); } catch { return null; }

  const genAI = new GoogleGenerativeAI(CONFIG.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prevHintSection = previousHints.length > 0
    ? `\nPrevious hints already given (do NOT repeat these ideas):\n${previousHints.map((h, i) => `  Round ${i + 1}: ${h}`).join("\n")}`
    : "";

  let divergenceSection;
  if (tier === 1 && divergenceStep != null) {
    divergenceSection = `
TIER 1 — Step-level divergence detected:
  Step number: ${divergenceStep}  (source line: ${divergenceLineno ?? "unknown"})
  Student's local variables at this step: ${JSON.stringify(studentLocals, null, 2)}
  Oracle's  local variables at this step: ${JSON.stringify(oracleLocals, null, 2)}
`;
  } else {
    const ratio = oracleElapsedMs > 0
      ? (studentElapsedMs / oracleElapsedMs).toFixed(1)
      : "N/A";
    divergenceSection = `
TIER 2 — Outcome-level differential (control-flow shapes differ too much for step alignment):
  Verdict:          ${verdict}
  Student runtime:  ${studentElapsedMs}ms
  Oracle  runtime:  ${oracleElapsedMs}ms  (student is ~${ratio}× slower)
`;
  }

  const systemPrompt = `You are a CS mentor reviewing a student's failed submission. \
You will be given: the problem statement, the student's code, execution telemetry showing \
exactly where their solution diverges from a correct reference solution. \
Your job is to ask ONE short Socratic question that guides the student towards the conceptual gap. \
Rules: NEVER output corrected code, a code patch, pseudocode that solves the problem, or the answer. \
Keep the hint under 60 words. Ask a question, don't state a fact.`;

  const userPrompt = `PROBLEM: ${problem.title}
${problem.description}

STUDENT CODE (${language}):
\`\`\`
${studentCode}
\`\`\`
${divergenceSection}${prevHintSection}

Ask one guiding question. No code, no answers.`;

  try {
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);
    return result.response.text().trim();
  } catch (err) {
    console.error("[ai]", err.message);
    return "I apologize, but I'm unable to generate a hint right now due to a temporary issue with the AI service. Please try again later.";
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Problem catalog
app.get("/api/problems", async (req, res) => {
  try {
    const problems = await Problem.find({}, { starterCode: 0 }).lean();
    res.json(problems);
  } catch (err) {
    console.error("[gateway] /api/problems", err.message);
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/problems/:id", async (req, res) => {
  try {
    const problem = await Problem.findOne({ problemId: req.params.id }).lean();
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/problems/:id/template", async (req, res) => {
  try {
    const { lang = "python" } = req.query;
    const problem = await Problem.findOne({ problemId: req.params.id }).lean();
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json({ code: (problem.starterCode || {})[lang] || "" });
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
});

// Session history
app.get("/api/sessions/:sessionId", async (req, res) => {
  try {
    const rounds = await Submission.find(
      { sessionId: req.params.sessionId },
    ).sort({ round: 1 }).lean();
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
});

// Submission history per user
app.get("/api/submissions/:userId", async (req, res) => {
  try {
    const subs = await Submission.find(
      { userId: req.params.userId },
      { studentTelemetry: 0, oracleTelemetry: 0 }
    ).sort({ createdAt: -1 }).limit(50).lean();
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
});

// ── Core: POST /api/trace ─────────────────────────────────────────────────────
app.post("/api/trace", apiLimiter, traceLimiter, validate(schemas.submission), async (req, res) => {
  const {
    student_code,
    problem_id,
    user_id,
    language = "python",
    session_id,
    round = 1,
  } = req.body;

  if (!student_code) return res.status(400).json({ error: "student_code is required" });
  if (!problem_id)   return res.status(400).json({ error: "problem_id is required" });

  const lang = language.toLowerCase();
  const cfg  = LANGUAGE_CONFIGS[lang];
  if (!cfg) return res.status(400).json({ error: `Unsupported language: ${lang}` });

  // Stable session ID — client sends it back on resubmit
  const sessionId = session_id || crypto.randomUUID();
  const roundNum  = Number(round) || 1;

  try {
    // ── 1. Fetch oracle & problem ─────────────────────────────────────────────
    const [oracleCode, problem] = await Promise.all([
      getOracleSolution(problem_id, lang),
      Problem.findOne({ problemId: problem_id }).lean(),
    ]);

    if (!oracleCode) {
      return res.status(400).json({
        error: `No oracle solution found for ${lang} / ${problem_id}`,
      });
    }

    // ── 2. Run sandbox ────────────────────────────────────────────────────────
    // Use shared language configs for consistent resource limits
    const dockerArgs = getDockerRunArgs(lang);

    // ── Inject test-driver calls into student code ────────────────────────────
    const student_code_with_driver = injectDriver(student_code, problem_id, lang);

    const studentB64 = Buffer.from(student_code_with_driver).toString("base64");
    const oracleB64  = Buffer.from(oracleCode).toString("base64");

    let container;
    let rawOutput;
    const envVars = [
      `STUDENT_CODE_B64=${studentB64}`,
      `ORACLE_CODE_B64=${oracleB64}`,
      `LANGUAGE=${lang}`,
      `TIMEOUT_MS=${dockerArgs.timeout}`,
      `MEMORY_MB=${dockerArgs.memory.replace('m', '')}`,
      `COMPILE_TIMEOUT_MS=${dockerArgs.compileTimeout}`,
    ];
    console.log("[gateway] Creating container with Env:", envVars.map(v => v.split("=")[0] + "=" + v.split("=")[1].slice(0, 30) + "..."));
    try {
      container = await docker.createContainer({
        Image: dockerArgs.image || CONFIG.sandboxImage,
        Env: envVars,
        HostConfig: {
          Memory:       parseInt(dockerArgs.memory) * 1024 * 1024,
          MemorySwap:   parseInt(dockerArgs.memorySwap) * 1024 * 1024,
          CpuQuota:     dockerArgs.cpuQuota,
          CpuPeriod:    dockerArgs.cpuPeriod,
          PidsLimit:    dockerArgs.pidsLimit,
          NetworkMode:  "none",
          ReadonlyRootfs: true,
          SecurityOpt:  ["no-new-privileges:true"],
          CapDrop:      ["ALL"],
          Tmpfs: {
            "/tmp": "rw,exec,nosuid,size=64m"
          },
          OomKillDisable: false,  // OOM kill-switch enabled
        },
        User: "1000:1000",
      });

      await container.start();

      const waitPromise = container.wait();
      const timeoutPromise = new Promise((_, rej) =>
        setTimeout(() => rej(new Error("container_timeout")), cfg.timeoutMs + 3000)
      );
      await Promise.race([waitPromise, timeoutPromise]);

      // Read logs and demux standard output
      const logsBuffer = await container.logs({ stdout: true, stderr: false, follow: false });
      rawOutput = demuxDockerStream(logsBuffer).toString("utf8").trim();

    } catch (err) {
      if (err.message === "container_timeout") {
        const sub = await new Submission({
          sessionId, round: roundNum, userId: user_id, problemId: problem_id,
          language: lang, verdict: "timeout",
          studentCodeHash: hashCode(student_code),
        }).save();
        return res.status(408).json({
          sessionId, verdict: "timeout",
          error: "Time Limit Exceeded — your solution ran longer than the allowed time.",
        });
      }
      throw err;
    } finally {
      if (container) { try { await container.remove({ force: true }); } catch {} }
    }

    // ── 3. Parse telemetry ────────────────────────────────────────────────────
    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      console.error("[gateway] Failed to parse sandbox output:", rawOutput?.slice(0, 300));
      return res.status(500).json({ error: "Sandbox output parse error" });
    }

    const student = parsed.student || {};
    const oracle  = parsed.oracle  || {};

    // ── 4. Compile error detection ────────────────────────────────────────────
    if (student.error === "compile_error") {
      const sub = await new Submission({
        sessionId, round: roundNum, userId: user_id, problemId: problem_id,
        language: lang, verdict: "compile_error",
        studentCodeHash: hashCode(student_code),
        studentTelemetry: student,
      }).save();
      return res.json({
        sessionId, verdict: "compile_error",
        compileError: student.stderr || "Compilation failed",
        round: roundNum,
      });
    }

    // Runtime error on student side
    if (student.error && student.error !== "compile_error") {
      const sub = await new Submission({
        sessionId, round: roundNum, userId: user_id, problemId: problem_id,
        language: lang, verdict: "runtime_error",
        studentCodeHash: hashCode(student_code),
        studentTelemetry: student,
      }).save();
      return res.json({
        sessionId, verdict: "runtime_error",
        runtimeError: student.error,
        round: roundNum,
      });
    }

    // ── 5. Tier determination (CORRECTED per spec §3.2) ───────────────────────
    const { tier } = evaluateTier(student, oracle, lang);

    // ── 6. Verdict determination ──────────────────────────────────────────────
    let verdict;
    let divergenceStep    = null;
    let divergenceLineno  = null;
    let studentLocals     = null;
    let oracleLocals      = null;

    if (tier === 1) {
      // Tier 1: compare step-by-step snapshots
      const diff = findDivergenceStep(student, oracle);
      divergenceStep   = diff.divergenceStep;
      divergenceLineno = diff.divergenceLineno;
      studentLocals    = diff.studentLocals;
      oracleLocals     = diff.oracleLocals;
      verdict = divergenceStep === null ? "convergent" : "divergent";
    } else {
      // Tier 2: compare stdout output
      const sOut = (student.stdout || "").trim();
      const oOut = (oracle.stdout  || "").trim();
      verdict = sOut === oOut ? "convergent" : "wrong_answer";
    }

    // ── 7. Socratic AI hint ───────────────────────────────────────────────────
    let aiHint = null;
    if (verdict !== "convergent" && problem) {
      // Gather previous hints so AI doesn't repeat itself
      const previousSubs = await Submission.find(
        { sessionId, aiHint: { $ne: null } },
        { aiHint: 1 }
      ).sort({ round: 1 }).lean();
      const previousHints = previousSubs.map(s => s.aiHint).filter(Boolean);

      aiHint = await getSocraticHint({
        problem,
        studentCode: student_code,
        language: lang,
        tier,
        verdict,
        divergenceStep,
        divergenceLineno,
        studentLocals,
        oracleLocals,
        studentElapsedMs: student.elapsed_ms || 0,
        oracleElapsedMs:  oracle.elapsed_ms  || 0,
        previousHints,
      });
    }

    // ── 8. Persist ────────────────────────────────────────────────────────────
    const submission = await new Submission({
      sessionId,
      round: roundNum,
      userId: user_id,
      problemId: problem_id,
      language: lang,
      tier,
      studentCodeHash: hashCode(student_code),
      oracleCodeHash:  hashCode(oracleCode),
      studentTelemetry: student,
      oracleTelemetry:  oracle,
      divergenceStep,
      divergenceLineno,
      studentLocals,
      oracleLocals,
      verdict,
      aiHint,
    }).save();

    // ── 9. Response ───────────────────────────────────────────────────────────
    res.json({
      sessionId,
      round:          roundNum,
      tier,
      verdict,
      divergenceStep,
      divergenceLineno,
      studentLocals,
      oracleLocals,
      studentSteps:   student.steps        || 0,
      oracleSteps:    oracle.steps         || 0,
      studentElapsedMs: student.elapsed_ms || 0,
      oracleElapsedMs:  oracle.elapsed_ms  || 0,
      studentStdout:  student.stdout       || "",
      oracleStdout:   oracle.stdout        || "",
      aiHint,
    });

  } catch (err) {
    if (err.code === "ENOENT" || err.message?.includes("No such image")) {
      return res.status(503).json({ error: "Sandbox image not built — run: make build-sandbox" });
    }
    console.error("[gateway]", err.message, err.stack?.split("\n")[1]);
    res.status(500).json({ error: "Internal error" });
  }
});

// CSRF token endpoint
app.get("/api/csrf-token", csrfTokenSetter, (req, res) => {
  res.json({ csrfToken: req.cookies?.["_csrf"] || null });
});

// Health check
app.get("/health", (req, res) => {
  const redisStatus = redis ? redis.status : "not_initialized";
  res.json({
    status:    "ok",
    mongo:     mongoose.connection.readyState === 1,
    redis:     redisStatus === "ready",
    sandbox:   CONFIG.sandboxImage,
  });
});

// SPA Fallback: handle page reloads for client-side routes (modules, workspace, etc.)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  const indexPath = path.join(staticDir, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send("Page not found");
});

// ── Server lifecycle ──────────────────────────────────────────────────────────
async function start() {
  await mongoose.connect(CONFIG.mongoUri, {
    maxPoolSize: CONFIG.maxPoolSize,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  });
  console.log("[gateway] MongoDB connected");

  server = app.listen(CONFIG.port, () => {
    console.log(`[gateway] Listening on port ${CONFIG.port}`);
  });
  return server;
}

async function stop() {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    server = null;
  }
  if (redis) {
    await redis.quit().catch(() => redis.disconnect());
    redis = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = app;
module.exports.start = start;
module.exports.stop  = stop;

if (require.main === module) {
  const shutdown = async (signal) => {
    try {
      await stop();
      console.log(`[gateway] Received ${signal}, shut down cleanly.`);
      process.exit(0);
    } catch (err) {
      console.error(`[gateway] Shutdown error after ${signal}:`, err.message);
      process.exit(1);
    }
  };
  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  start().catch((err) => {
    console.error("[gateway] Failed to start:", err.message);
    process.exit(1);
  });
}
