const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  round: { type: Number, required: true, min: 1, max: 5 },
  verdict: {
    type: String,
    required: true,
  },
  tier: { type: Number },
  traceLog: { type: mongoose.Schema.Types.Mixed },
  divergenceStep: { type: Number },
  tier2Result: {
    studentTimeMs: { type: Number, default: 0 },
    oracleTimeMs: { type: Number, default: 0 },
    studentMemMb: { type: Number, default: 0 },
    oracleMemMb: { type: Number, default: 0 },
  },
  hiddenTestResults: {
    passed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    categoriesFailed: [{ type: String }],
    details: [{ type: mongoose.Schema.Types.Mixed }],
  },
  aiAnalysis: {
    agent: { type: String },
    confidence: { type: mongoose.Schema.Types.Mixed },
    response: { type: String },
    codeAnalysis: { type: mongoose.Schema.Types.Mixed },
    oracleComparison: { type: mongoose.Schema.Types.Mixed },
  },
  hint: { type: String },
  hintLevel: { type: Number, min: 1, max: 5 },
  ipAddress: { type: String },
  userAgent: { type: String },
  containerId: { type: String },
  exitCode: { type: Number },
  compileOutput: { type: String },
  oracleOutput: { type: String },
  diffOutput: { type: String },
  executionMode: {
    type: String,
    default: "submit",
  },
  customInputUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

submissionSchema.index({ userId: 1, verdict: 1, problemId: 1 });
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ sessionId: 1, round: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
