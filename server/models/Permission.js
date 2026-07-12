const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["super_admin", "admin", "instructor", "student", "guest"],
    required: true,
  },
  resource: {
    type: String,
    required: true,
  },
  resourceId: {
    type: String,
    default: "*",
  },
  actions: [{
    type: String,
    enum: ["create", "read", "update", "delete", "unlock", "access", "manage"],
  }],
}, { timestamps: true });

permissionSchema.index({ role: 1, resource: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model("Permission", permissionSchema);
