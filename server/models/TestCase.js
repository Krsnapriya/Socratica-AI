const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
  problemId: { type: String, required: true },
  language: { type: String, required: true },
  visibility: { type: String, required: true, default: "public" },
  category: {
    type: String,
    default: "sample",
  },
  input: { type: String, required: true },
  expectedOutput: {
    type: String,
    validate: {
      validator: (v) => v !== null && v !== undefined,
      message: "expectedOutput is required",
    },
  },
  weight: { type: Number, default: 1, min: 0 },
  timeLimitMs: { type: Number, default: 8000 },
  memoryLimitMb: { type: Number, default: 256 },
  description: { type: String, default: "" },
  order: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

testCaseSchema.index({ problemId: 1, visibility: 1 });
testCaseSchema.index({ problemId: 1, category: 1 });
testCaseSchema.index({ problemId: 1, language: 1 });

module.exports = mongoose.model("TestCase", testCaseSchema);
