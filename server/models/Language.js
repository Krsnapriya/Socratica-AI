// Language — DB-driven language configs that replace hardcoded sandbox config.
// Admin can add/modify languages without code changes.

const mongoose = require("mongoose");

const languageSchema = new mongoose.Schema({
  id: { type: String, required: true, trim: true },  // "python", "cpp", "javascript"
  label: { type: String, required: true },  // "Python 3", "C++17", "JavaScript (Node)"
  ext: { type: String, required: true },  // ".py", ".cpp", ".js"
  image: { type: String, default: "" },  // Docker image
  memoryMb: { type: Number, default: 256 },
  cpuQuota: { type: Number, default: 50000 },
  timeoutMs: { type: Number, default: 8000 },
  compileTimeoutMs: { type: Number, default: 0 },
  compile: { type: String, default: null },  // compile command template or null
  run: { type: String, required: true },  // run command template
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

languageSchema.index({ id: 1 }, { unique: true });

module.exports = mongoose.model("Language", languageSchema);
