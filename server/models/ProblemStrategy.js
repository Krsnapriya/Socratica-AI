// ProblemStrategy — DB-driven oracle comparator strategies.
// Admin can add/modify algorithm strategies per problem without code changes.

const mongoose = require("mongoose");

const problemStrategySchema = new mongoose.Schema({
  problemId: { type: String, required: true, trim: true },
  strategies: [{
    name: { type: String, required: true },       // "brute_force", "two_pointer", "binary_search"
    timeComplexity: { type: String, default: "" },  // "O(n^2)", "O(n log n)"
    spaceComplexity: { type: String, default: "" }, // "O(1)", "O(n)"
    description: { type: String, default: "" },
    isOptimal: { type: Boolean, default: false },
  }],
  optimalComplexity: { type: String, default: "" },  // "O(n)"
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

problemStrategySchema.index({ problemId: 1 }, { unique: true });

module.exports = mongoose.model("ProblemStrategy", problemStrategySchema);
