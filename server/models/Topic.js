// Topic — DB-driven knowledge graph that replaces hardcoded prerequisite map.
// Admin can add/modify topics and prerequisites without code changes.

const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },  // "fundamentals", "algorithms", "data_structures", etc.
  dependsOn: [{ type: String }],  // prerequisite topic names
  description: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

topicSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Topic", topicSchema);
