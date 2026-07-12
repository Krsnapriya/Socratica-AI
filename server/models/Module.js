const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  problemId: { type: String, required: true }, // Links to the unique problemId in the Problem model
});

const moduleSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String },
  order: { type: Number, default: 0 },
  topics: [topicSchema],
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }]
}, { timestamps: true });

moduleSchema.index({ "topics.problemId": 1 });

module.exports = mongoose.model("Module", moduleSchema);
