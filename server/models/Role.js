// Role — DB-driven roles that replace hardcoded enum constraints.
// Admin can add/remove roles without code changes or migrations.

const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  displayName: { type: String, required: true },
  description: { type: String, default: "" },
  permissions: [{ type: String }],  // e.g. ["users:read", "problems:create"]
  config: {
    aiRateLimit: { type: Number, default: 30 },
    aiWindowMs: { type: Number, default: 60000 },
    maxSubmissionsPerDay: { type: Number, default: 100 },
  },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

roleSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);
