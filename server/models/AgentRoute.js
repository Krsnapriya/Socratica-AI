// AgentRoute — DB-driven agent routing configuration.
// Admin can modify action→agent mappings without code changes.

const mongoose = require("mongoose");

const agentRouteSchema = new mongoose.Schema({
  role: { type: String, required: true },
  action: { type: String, required: true },
  agents: [{ type: String }],
  gates: {
    oracleSolution: [{ type: String }],
    hiddenTests: [{ type: String }],
    studentEmail: [{ type: String }],
    submissionHistory: [{ type: String }],
    aiMemory: [{ type: String }],
    systemMetrics: [{ type: String }],
    securityLogs: [{ type: String }],
    costData: [{ type: String }],
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

agentRouteSchema.index({ role: 1, action: 1 }, { unique: true });

module.exports = mongoose.model("AgentRoute", agentRouteSchema);
