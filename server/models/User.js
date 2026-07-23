const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: false },
  provider: { type: String, enum: ["local", "google"], default: "local" },
  googleId: { type: String, sparse: true },
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
    default: "student"
  },
  emailVerified: { type: Boolean, default: false, index: true },
  emailVerifyToken: { type: String, index: true },
  emailVerifyTokenExpires: { type: Date },
  passwordResetToken: { type: String, index: true },
  passwordResetExpires: { type: Date },
  lastLoginAt: { type: Date },
  unlockedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module', index: true }],
  lastActiveAt: { type: Date, default: Date.now, index: true },
  tokenVersion: { type: Number, default: 0 },
  learningProfile: {
    skillLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
    preferredStyle: { type: String, enum: ["socratic", "direct", "example", "analogy"], default: "socratic" },
    weakTopics: [{ type: String }],
    strongTopics: [{ type: String }],
    lastProblemCategory: { type: String },
    totalProblemsSolved: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastPracticeDate: { type: Date },
    teachingMemory: {
      commonMistakes: [{
        type: { type: String },
        timestamp: { type: Date },
        problemId: { type: String },
      }],
      learningVelocity: { type: String, enum: ["slow", "moderate", "fast"], default: "moderate" },
      lastAiFeedback: { type: String },
      lastAiFeedbackDate: { type: Date },
    },
  },
}, { timestamps: true });

// Optimizing for query patterns
userSchema.index({ role: 1, lastActiveAt: -1 });

module.exports = mongoose.model("User", userSchema);
