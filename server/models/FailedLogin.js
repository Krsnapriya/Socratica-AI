const mongoose = require("mongoose");

const failedLoginSchema = new mongoose.Schema({
  email: { type: String, required: true },
  ip: { type: String, required: true },
  userAgent: { type: String },
  reason: { type: String, default: "invalid_password" },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

failedLoginSchema.index({ timestamp: -1 });
failedLoginSchema.index({ email: 1, timestamp: -1 });
failedLoginSchema.index({ ip: 1, timestamp: -1 });

module.exports = mongoose.model("FailedLogin", failedLoginSchema);
