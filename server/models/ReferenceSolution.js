const mongoose = require("mongoose");

const referenceSolutionSchema = new mongoose.Schema({
  problemId: { type: String, required: true, index: true },
  language: { type: String, required: true, enum: ["python", "cpp", "javascript"] },
  variant: {
    type: String,
    required: true,
    enum: ["most_readable", "fastest", "lowest_memory", "beginner_friendly", "functional", "recursive", "iterative", "standard"],
    default: "standard",
  },
  code: { type: String, required: true },
  timeComplexity: { type: String, default: "" },
  spaceComplexity: { type: String, default: "" },
  algorithm: { type: String, default: "" },
  description: { type: String, default: "" },
  isPrimary: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

referenceSolutionSchema.index({ problemId: 1, language: 1, variant: 1 }, { unique: true });

module.exports = mongoose.model("ReferenceSolution", referenceSolutionSchema);
