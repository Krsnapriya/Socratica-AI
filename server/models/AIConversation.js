const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["system", "user", "assistant"], required: true },
  content: { type: String, required: true },
  context: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

const aiConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sessionId: { type: String, required: true },
  topic: { type: String, default: "general" },
  messages: [messageSchema],
  metadata: {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
    problemId: { type: String },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission" },
    preferredStyle: { type: String, enum: ["beginner", "intermediate", "expert", "analogy", "step_by_step", "socratic"], default: "intermediate" },
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

aiConversationSchema.index({ userId: 1, sessionId: 1 });
aiConversationSchema.index({ userId: 1, active: 1 });

module.exports = mongoose.model("AIConversation", aiConversationSchema);
