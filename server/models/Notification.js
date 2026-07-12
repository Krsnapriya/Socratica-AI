const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ["broadcast", "info", "warning", "announcement"], default: "broadcast" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience: { type: String, enum: ["all", "students", "instructors", "admins"], default: "all" },
  link: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ active: 1, expiresAt: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
