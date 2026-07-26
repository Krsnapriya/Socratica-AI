require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN || "",
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  enabled: !!process.env.SENTRY_DSN,
  integrations: process.env.SENTRY_DSN && Sentry.expressIntegration ? [Sentry.expressIntegration()] : [],
  debug: false,
});
const authRoutes = require("./routes/auth");
const problemsRoutes = require("./routes/problems");
const submissionsRoutes = require("./routes/submissions");
const executeRoutes = require("./routes/execute");
const adminRoutes = require("./routes/admin");
const coursesRoutes = require("./routes/courses");
const sessionRoutes = require("./routes/sessions");
const notificationRoutes = require("./routes/notifications");
const achievementRoutes = require("./routes/achievements");
const aiRoutes = require("./routes/ai");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const cookieParser = require("cookie-parser");
const { csrfProtection, csrfToken } = require("./middleware/csrf");
const configLoader = require("./configLoader");
const knowledgeGraph = require("./ai/knowledgeGraph");
const roleRouter = require("./ai/roleRouter");
const codeAnalyzer = require("./ai/codeAnalyzer");
const oracleComparator = require("./ai/oracleComparator");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

if (Sentry.Handlers) app.use(Sentry.Handlers.requestHandler());
app.use(helmet({
  contentSecurityPolicy: false,
}));
const defaultOrigins = [
  'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:4173',
  'https://socratica-ai.netlify.app',
  'https://socratica-backend-production.up.railway.app',
];
const allowedOrigins = process.env.CORS_ORIGIN
  ? [...new Set([...process.env.CORS_ORIGIN.split(",").map(s => s.trim()), ...defaultOrigins])]
  : defaultOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any netlify.app or railway.app subdomain
    if (/\.netlify\.app$/.test(origin) || /\.railway\.app$/.test(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // fail-open for now — tighten in production
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.set("trust proxy", 1);
app.use("/api/", apiLimiter);

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api/auth", authLimiter, authRoutes);

// CSRF token endpoint must be accessible before csrfProtection
app.get("/api/csrf-token", csrfToken, (req, res) => res.json({ token: req._csrfToken || req.cookies?._csrf }));

// Submissions & AI bypass CSRF — students need reliable access from Workspace
app.use("/api/submissions", submissionsRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/ai", aiRoutes);

// Apply CSRF protection to all other state-changing endpoints
app.use(csrfProtection);
app.use("/api/problems", problemsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/achievements", achievementRoutes);

app.get(["/api/health", "/health"], async (_req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  const mongoStatus = dbState[mongoose.connection.readyState] || "unknown";
  const redisOk = require("./redis").isConnected();

  let mongoPing = false;
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      mongoPing = true;
    }
  } catch (_) {}

  const healthy = mongoPing && mongoStatus === "connected";
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    mongo: mongoStatus,
    mongoPing,
    redis: redisOk ? "connected" : "in-memory",
    uptime: process.uptime().toFixed(1) + "s",
    pid: process.pid,
  });
});

if (Sentry.setupExpressErrorHandler) {
  Sentry.setupExpressErrorHandler(app);
} else if (Sentry.Handlers) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const path = require("path");
const fs = require("fs");
const clientDist = path.join(__dirname, "../client/dist");
const refactoredDir = path.join(__dirname, "../refactored");
const serverStaticDir = fs.existsSync(clientDist) ? clientDist : (fs.existsSync(refactoredDir) ? refactoredDir : null);

if (serverStaticDir) {
  app.use(express.static(serverStaticDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    const indexPath = path.join(serverStaticDir, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    res.status(404).send("Page not found");
  });
}

let cachedDb = null;
async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;

  // Try the configured MONGO_URI with retries
  const retries = 3;
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      cachedDb = mongoose.connection;
      console.log("[server] MongoDB connected →", MONGO_URI);
      return cachedDb;
    } catch (err) {
      console.warn(`[server] DB connect attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Try in-memory MongoDB as last resort (dev only)
  if (process.env.NODE_ENV !== "production") {
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      cachedDb = mongoose.connection;
      console.log("[server] In-memory MongoDB connected →", memoryUri);
    } catch (memErr) {
      console.error("[server] Failed to start MongoMemoryServer:", memErr.message);
    }
  } else {
    console.error("[server] CRITICAL: Could not connect to MongoDB. Set MONGO_URI env var to a valid MongoDB Atlas connection string.");
  }

  return cachedDb;
}

// Auto-seed permissions, configs, roles, languages, topics, prompts, patterns, routes on first run
let seeded = false;
async function autoSeed() {
  if (seeded) return;
  seeded = true;
  try {
    await connectDB();

    // Load config from DB (so admin changes take effect)
    await configLoader.loadFromDB();
    console.log("[server] Config loaded from DB");

    // Load knowledge graph from DB
    await knowledgeGraph.loadFromDB();
    console.log("[server] Knowledge graph loaded from DB");

    // Load AI subsystem configs from DB
    await roleRouter.loadFromDB();
    console.log("[server] Role router loaded from DB");

    await codeAnalyzer.loadFromDB();
    console.log("[server] Code analyzer loaded from DB");

    await oracleComparator.loadFromDB();
    console.log("[server] Oracle comparator loaded from DB");

    const Permission = require("./models/Permission");
    const SystemConfig = require("./models/SystemConfig");
    const Role = require("./models/Role");
    const Language = require("./models/Language");
    const Topic = require("./models/Topic");
    const AIPrompt = require("./models/AIPrompt");
    const User = require("./models/User");

    // Seed permissions
    const newResources = ["users", "courses", "modules", "problems", "permissions", "analytics", "audit_logs"];
    const hasNew = await Permission.countDocuments({ resource: { $in: newResources } });
    if (hasNew === 0) {
      console.log("[server] No granular permissions found — reseeding defaults...");
      await Permission.deleteMany({});
      await require("./seedPermissions")();
    }

    // Seed SystemConfig
    const cfgCount = await SystemConfig.countDocuments();
    if (cfgCount === 0) {
      console.log("[server] No system configs found — seeding defaults...");
      const { seedConfigs } = require("./seedPermissions");
      await seedConfigs();
    }

    // Seed Roles
    const roleCount = await Role.countDocuments();
    if (roleCount === 0) {
      console.log("[server] No roles found — seeding defaults...");
      await require("./seedRoles")();
    }

    // Seed / sync test users (all 5 default role accounts)
    console.log("[server] Syncing default role accounts...");
    await require("./seedUsers")();

    // Seed Languages
    const langCount = await Language.countDocuments();
    if (langCount === 0) {
      console.log("[server] No languages found — seeding defaults...");
      await require("./seedLanguages")();
    }

    // Seed Topics (knowledge graph)
    const topicCount = await Topic.countDocuments();
    if (topicCount === 0) {
      console.log("[server] No topics found — seeding defaults...");
      await require("./seedTopics")();
      await knowledgeGraph.loadFromDB(); // reload after seed
    }

    // Seed AI Prompts
    const promptCount = await AIPrompt.countDocuments();
    if (promptCount === 0) {
      console.log("[server] No AI prompts found — seeding defaults...");
      await require("./seedAIPrompts")();
    }

    // Seed Analysis Patterns
    const AnalysisPattern = require("./models/AnalysisPattern");
    const patternCount = await AnalysisPattern.countDocuments();
    if (patternCount === 0) {
      console.log("[server] No analysis patterns found — seeding defaults...");
      await require("./seedAnalysisPatterns")();
    }

    // Seed Agent Routes
    const AgentRoute = require("./models/AgentRoute");
    const routeCount = await AgentRoute.countDocuments();
    if (routeCount === 0) {
      console.log("[server] No agent routes found — seeding defaults...");
      await require("./seedAgentRoutes")();
    }

    // Reload AI subsystem caches after all seeds
    await roleRouter.loadFromDB();
    await codeAnalyzer.loadFromDB();
    await oracleComparator.loadFromDB();
    console.log("[server] All AI subsystem configs reloaded");

    // Seed content (problems, courses, modules) if empty
    const Problem = require("./models/Problem");
    const problemCount = await Problem.countDocuments();
    if (problemCount === 0) {
      console.log("[server] No problems found — seeding course content...");
      await require("./seedContent")();
      console.log("[server] Course content seeded");
    }

    // Seed test cases and drivers if empty
    const TestCase = require("./models/TestCase");
    const testCaseCount = await TestCase.countDocuments();
    if (testCaseCount === 0) {
      console.log("[server] No test cases found — seeding test cases and drivers...");
      try {
        await require("./seedTestCases")();
        console.log("[server] Test cases for problems 1-13 seeded");
      } catch (e) { console.warn("[server] seedTestCases error:", e.message?.slice(0, 200)); }
      try {
        await require("./seedNewProblemTestCases")();
        console.log("[server] Test cases for problems 14-23 seeded");
      } catch (e) { console.warn("[server] seedNewProblemTestCases error:", e.message?.slice(0, 200)); }
    }

    // Seed reference solutions (JS/C++ oracles + ReferenceSolution entries) if empty
    const ReferenceSolution = require("./models/ReferenceSolution");
    const refSolCount = await ReferenceSolution.countDocuments();
    if (refSolCount === 0) {
      console.log("[server] No reference solutions found — seeding JS/C++ oracles...");
      try {
        await require("./seedReferenceSolutions")();
        console.log("[server] Reference solutions seeded");
      } catch (e) { console.warn("[server] seedReferenceSolutions error:", e.message?.slice(0, 200)); }
    }

  } catch (err) {
    console.warn("[server] Auto-seed error:", err.message);
  }
}

// Only listen when run directly
if (require.main === module || !process.env.VERCEL) {
  (async () => {
    await connectDB();
    await autoSeed();

    function startServer(portToTry) {
      const server = app.listen(portToTry, () => {
        console.log(`[server] Listening on http://localhost:${portToTry}`);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          const nextPort = parseInt(portToTry, 10) + 1;
          console.warn(`[server] Port ${portToTry} in use — trying http://localhost:${nextPort}...`);
          startServer(nextPort);
        } else {
          console.error("[server] Fatal server error:", err);
        }
      });

      // Graceful shutdown
      let shuttingDown = false;
      async function shutdown(signal) {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log(`\n[server] ${signal} received — shutting down gracefully...`);

        server.close(async () => {
          console.log("[server] HTTP server closed");
          try {
            await mongoose.connection.close(false);
            console.log("[server] MongoDB connection closed");
          } catch (_) {}
          try {
            const redis = require("./redis");
            if (redis.disconnect) redis.disconnect();
          } catch (_) {}
          console.log("[server] Cleanup complete — exiting");
          process.exit(0);
        });

        // Force kill after 10s
        setTimeout(() => {
          console.error("[server] Forced shutdown after timeout");
          process.exit(1);
        }, 10000).unref();
      }

      process.on("SIGTERM", () => shutdown("SIGTERM"));
      process.on("SIGINT", () => shutdown("SIGINT"));
    }

    startServer(PORT);

    process.on("unhandledRejection", (err) => {
      console.error("[server] Unhandled rejection:", err);
    });
  })();
}

module.exports = app;
