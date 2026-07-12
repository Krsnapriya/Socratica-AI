const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  problemId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  // 'statement' is the canonical field (legacy), 'description' is the frontend-friendly alias
  statement: { type: String, required: true },
  description: { type: String, default: "" }, // populated from statement if empty
  category: { type: String, default: "General" },
  difficulty: { type: String, required: true, enum: ["easy", "medium", "hard"] },
  tags: { type: [String], default: [] },
  estimatedMinutes: { type: Number, default: 30 },
  starterCode: {
    python: { type: String, default: "" },
    cpp: { type: String, default: "" },
    javascript: { type: String, default: "" },
  },
  oracleSolutions: {
    python: { type: String, default: "" },
    cpp: { type: String, default: "" },
    javascript: { type: String, default: "" },
  },
  oracleVerified: {
    python: { type: Boolean, default: false },
    cpp: { type: Boolean, default: false },
    javascript: { type: Boolean, default: false },
  },
  testCases: { type: [Object], default: [] },
  hiddenTestCases: { type: [Object], default: [] },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });

// Pre-save: copy statement → description if description is empty
problemSchema.pre("save", function (next) {
  if (!this.description && this.statement) {
    this.description = this.statement;
  }
  next();
});

module.exports = mongoose.model("Problem", problemSchema);
