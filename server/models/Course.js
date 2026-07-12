const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: 'school' },
  order: { type: Number, default: 0 },
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  isPublished: { type: Boolean, default: false },
  estimatedHours: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
