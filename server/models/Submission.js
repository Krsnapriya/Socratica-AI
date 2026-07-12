const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  problemId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  code: { type: String, required: true },
  language: { type: String, required: true, enum: ["python", "cpp", "javascript"] },
  round: { type: Number, required: true, min: 1, max: 5 },
  verdict: {
    type: String,
    required: true,
    enum: ["pass", "fail", "compile_error", "timeout", "memory_exceeded", "recursion_limit_exceeded", "system_judge_error"],
  },
  tier: { type: Number, enum: [1, 2] },
  traceLog: { type: mongoose.Schema.Types.Mixed },
  divergenceStep: { type: Number },
  tier2Result: {
    studentTimeMs: { type: Number, default: 0 },
    oracleTimeMs: { type: Number, default: 0 },
    studentMemMb: { type: Number, default: 0 },
    oracleMemMb: { type: Number, default: 0 },
  },
  hint: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  containerId: { type: String },
  exitCode: { type: Number },
  compileOutput: { type: String },
  oracleOutput: { type: String },
  diffOutput: { type: String },
  createdAt: { type: Date, default: Date.now },
});

submissionSchema.index({ userId: 1, verdict: 1, problemId: 1 });
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ sessionId: 1, round: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
