const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  type: { type: String, enum: ["next_topic", "revision", "practice", "challenge", "project"], required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
  problemId: { type: String },
  reason: { type: String },
  priority: { type: Number, default: 0, min: 0, max: 100 },
  completed: { type: Boolean, default: false },
});

const weakAreaSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  pattern: { type: String },
  frequency: { type: Number, default: 0 },
  lastDetected: { type: Date },
  suggestedPractice: [{ type: String }],
});

const learningPathSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  weakAreas: [weakAreaSchema],
  recommendations: [recommendationSchema],
  strengths: [{ type: String }],
  lastAnalyzed: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("LearningPath", learningPathSchema);
