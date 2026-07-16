const crypto = require("crypto");
const { config } = require("../configLoader");

function csrfProtection(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS
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

function csrfToken(req, res, next) {
  if (!req.cookies?.["_csrf"]) {
    const token = crypto.randomBytes(32).toString("hex");
    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
    res.cookie("_csrf", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: config.csrf.maxAgeMs,
    });
    req._csrfToken = token;
  } else {
    req._csrfToken = req.cookies._csrf;
  }
  next();
}

module.exports = { csrfProtection, csrfToken };
