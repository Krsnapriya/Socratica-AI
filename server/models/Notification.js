const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: { type: String, default: "broadcast" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience: { type: String, default: "all" },
  link: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ active: 1, expiresAt: 1 });
notificationSchema.index({ readBy: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
