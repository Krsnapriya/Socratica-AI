const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, default: "" },
  bio: { type: String, default: "" },
  preferences: {
    language: { type: String, default: "python" },
    tabSize: { type: String, default: "4 spaces" },
    theme: { type: String, default: "Socratica Dark" },
    fontSize: { type: String, default: "14px" },
    telemetry: { type: Boolean, default: true },
    strictMode: { type: Boolean, default: false },
  },
  role: {
    type: String,
    enum: ["super_admin", "admin", "instructor", "student", "guest"],
    default: "student",
    index: true
  },
  emailVerified: { type: Boolean, default: false, index: true },
  emailVerifyToken: { type: String, index: true },
  emailVerifyTokenExpires: { type: Date },
  passwordResetToken: { type: String, index: true },
  passwordResetExpires: { type: Date },
  lastLoginAt: { type: Date },
  unlockedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module', index: true }],
  lastActiveAt: { type: Date, default: Date.now, index: true },
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

// Optimizing for query patterns
userSchema.index({ role: 1, lastActiveAt: -1 });

module.exports = mongoose.model("User", userSchema);
