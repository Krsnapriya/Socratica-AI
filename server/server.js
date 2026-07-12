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
const adminRoutes = require("./routes/admin");
const coursesRoutes = require("./routes/courses");
const sessionRoutes = require("./routes/sessions");
const notificationRoutes = require("./routes/notifications");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const cookieParser = require("cookie-parser");
const { csrfProtection, csrfToken } = require("./middleware/csrf");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

if (Sentry.Handlers) app.use(Sentry.Handlers.requestHandler());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "cdn.jsdelivr.net", "unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com"],
      fontSrc: ["'self'", "cdn.jsdelivr.net"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:4173'],
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

// Submissions bypass CSRF — students need reliable submission from Workspace
app.use("/api/submissions", submissionsRoutes);

app.use(csrfProtection);
app.use("/api/problems", problemsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/notifications", notificationRoutes);

app.get(["/api/health", "/health"], (_req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    mongo: dbState[mongoose.connection.readyState] || "unknown",
    uptime: process.uptime().toFixed(1) + "s",
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

let cachedDb = null;
async function connectDB() {
  if (cachedDb) return cachedDb;
  try {
    await mongoose.connect(MONGO_URI);
    cachedDb = mongoose.connection;
    console.log("[server] MongoDB connected →", MONGO_URI);
  } catch (err) {
    console.error("[server] DB connection error:", err.message);
  }
  return cachedDb;
}

// Auto-seed permissions and configs on first run
let seeded = false;
async function autoSeed() {
  if (seeded) return;
  seeded = true;
  try {
    await connectDB();
    const Permission = require("./models/Permission");
    const SystemConfig = require("./models/SystemConfig");
    const newResources = ["users", "courses", "modules", "problems", "permissions", "analytics", "audit_logs"];
    const hasNew = await Permission.countDocuments({ resource: { $in: newResources } });
    if (hasNew === 0) {
      console.log("[server] No granular permissions found — reseeding defaults...");
      await Permission.deleteMany({});
      await require("./seedPermissions")();
    }
    const cfgCount = await SystemConfig.countDocuments();
    if (cfgCount === 0) {
      console.log("[server] No system configs found — seeding defaults...");
      const { seedConfigs } = require("./seedPermissions");
      await seedConfigs();
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
    app.listen(PORT, () => {
      console.log(`[server] Listening on http://localhost:${PORT}`);
    });
  })();
}

module.exports = app;
