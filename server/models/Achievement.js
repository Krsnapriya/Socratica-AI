const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  achievementKey: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "emoji_events" },
  category: { type: String, enum: ["submission", "streak", "milestone", "language", "special"], default: "milestone" },
  unlockedAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

achievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });
achievementSchema.index({ userId: 1, unlockedAt: -1 });

module.exports = mongoose.model("Achievement", achievementSchema);
