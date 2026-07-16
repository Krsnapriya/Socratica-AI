// AIPrompt — DB-driven agent prompts with versioning.
// Admin can edit prompts, A/B test, and toggle active versions without deploy.

const mongoose = require("mongoose");

const aiPromptSchema = new mongoose.Schema({
  agentType: { type: String, required: true },  // "tutor", "hint", "codeReview", etc.
  version: { type: Number, default: 1 },
  systemPrompt: { type: String, required: true },
  description: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },  // A/B test tags, notes
}, { timestamps: true });

// Compound unique index: one active version per agentType
aiPromptSchema.index({ agentType: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("AIPrompt", aiPromptSchema);
