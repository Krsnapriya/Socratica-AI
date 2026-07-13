const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  problemId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  statement: { type: String, required: true },
  description: { type: String, default: "" },
  category: { type: String, default: "General" },
  difficulty: { type: String, required: true, enum: ["easy", "medium", "hard"] },
  tags: { type: [String], default: [] },
  estimatedMinutes: { type: Number, default: 30 },
  timeLimitMs: { type: Number, default: 8000 },
  memoryLimitMb: { type: Number, default: 256 },
  maxRounds: { type: Number, default: 5 },
  supportedLanguages: { type: [String], default: ["python", "cpp", "javascript"] },
  starterCode: {
    python: { type: String, default: "" },
    cpp: { type: String, default: "" },
    javascript: { type: String, default: "" },
  },
  oracleSolutions: {
    python: { type: String, default: "" },
    cpp: { type: String, default: "" },
    javascript: { type: String, default: "" },
  },
  oracleVerified: {
    python: { type: Boolean, default: false },
    cpp: { type: Boolean, default: false },
    javascript: { type: Boolean, default: false },
  },
  driverConfig: {
    type: Map,
    of: {
      driverCode: { type: String },
      wrapperType: { type: String, enum: ["function_call", "stdin_stdout", "custom"], default: "function_call" },
      functionName: { type: String, default: "" },
    },
    default: {},
  },
  testCases: { type: [Object], default: [] },
  hiddenTestCases: { type: [Object], default: [] },
  executionConfig: {
    defaultTimeLimitMs: { type: Number, default: 8000 },
    defaultMemoryLimitMb: { type: Number, default: 256 },
    compileTimeoutMs: { type: Number, default: 15000 },
  },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });

problemSchema.pre("save", function (next) {
  if (!this.description && this.statement) {
    this.description = this.statement;
  }
  next();
});

module.exports = mongoose.model("Problem", problemSchema);
