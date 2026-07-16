const mongoose = require("mongoose");

const driverTemplateSchema = new mongoose.Schema({
  problemId: { type: String, required: true },
  language: { type: String, required: true, enum: ["python", "cpp", "javascript"] },
  driverCode: { type: String, required: true },
  stdinTemplate: { type: String, default: "" },
  wrapperType: {
    type: String,
    enum: ["function_call", "stdin_stdout", "custom"],
    default: "function_call",
  },
  functionName: { type: String, default: "" },
  description: { type: String, default: "" },
}, { timestamps: true });

driverTemplateSchema.index({ problemId: 1, language: 1 }, { unique: true });

module.exports = mongoose.model("DriverTemplate", driverTemplateSchema);
