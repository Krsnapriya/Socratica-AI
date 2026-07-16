// AnalysisPattern — DB-driven code analysis patterns.
// Admin can add/modify detection patterns without code changes.

const mongoose = require("mongoose");

const analysisPatternSchema = new mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String, required: true },
  regex: { type: String, required: true },  // regex pattern as string
  severity: { type: String, default: "medium" },
  complexity: { type: String, default: "" },  // for time complexity patterns
  description: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

analysisPatternSchema.index({ type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("AnalysisPattern", analysisPatternSchema);
