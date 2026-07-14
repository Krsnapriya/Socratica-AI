// AI Usage Tracking Model — observability for all AI requests

const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  role: { type: String, enum: ["guest", "student", "instructor", "admin", "super_admin"], index: true },
  action: { type: String, required: true, index: true },
  agentType: { type: String },
  model: { type: String },
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  success: { type: Boolean, default: true },
  error: { type: String },
  circuitBreakerState: { type: String },
  cached: { type: Boolean, default: false },
  problemId: { type: String, index: true },
  sessionId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

aiUsageSchema.index({ createdAt: 1, action: 1 });
aiUsageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("AIUsage", aiUsageSchema);
