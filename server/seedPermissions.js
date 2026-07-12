const Permission = require("./models/Permission");
const SystemConfig = require("./models/SystemConfig");

const defaults = [
  // super_admin — full access to everything (middleware bypasses checks for this role)
  // Permissions doc just for documentation/UI
  { role: "super_admin", resource: "*", resourceId: "*", actions: ["manage"] },

  // admin — manage all operational resources
  { role: "admin", resource: "users", resourceId: "*", actions: ["create", "read", "update", "delete", "manage"] },
  { role: "admin", resource: "courses", resourceId: "*", actions: ["create", "read", "update", "delete", "manage"] },
  { role: "admin", resource: "modules", resourceId: "*", actions: ["create", "read", "update", "delete", "manage"] },
  { role: "admin", resource: "problems", resourceId: "*", actions: ["create", "read", "update", "delete", "manage"] },
  { role: "admin", resource: "permissions", resourceId: "*", actions: ["read"] },
  { role: "admin", resource: "submissions", resourceId: "*", actions: ["read", "delete"] },
  { role: "admin", resource: "analytics", resourceId: "*", actions: ["read"] },
  { role: "admin", resource: "audit_logs", resourceId: "*", actions: ["read"] },
  { role: "admin", resource: "compiler", resourceId: "*", actions: ["read", "update"] },
  { role: "admin", resource: "ai", resourceId: "*", actions: ["read", "update"] },
  { role: "admin", resource: "notifications", resourceId: "*", actions: ["create"] },

  // instructor — read on content, access on tools
  { role: "instructor", resource: "courses", resourceId: "*", actions: ["read"] },
  { role: "instructor", resource: "modules", resourceId: "*", actions: ["read"] },
  { role: "instructor", resource: "problems", resourceId: "*", actions: ["read"] },
  { role: "instructor", resource: "compiler", resourceId: "*", actions: ["access"] },
  { role: "instructor", resource: "workspace", resourceId: "*", actions: ["access"] },
  { role: "instructor", resource: "analytics", resourceId: "*", actions: ["read"] },
  { role: "instructor", resource: "submissions", resourceId: "*", actions: ["read"] },

  // student — read on content, access on tools
  { role: "student", resource: "courses", resourceId: "*", actions: ["read"] },
  { role: "student", resource: "modules", resourceId: "*", actions: ["read"] },
  { role: "student", resource: "problems", resourceId: "*", actions: ["read"] },
  { role: "student", resource: "compiler", resourceId: "*", actions: ["access"] },
  { role: "student", resource: "workspace", resourceId: "*", actions: ["access"] },
  { role: "student", resource: "submissions", resourceId: "*", actions: ["create"] },

  // guest — read on courses only (public)
  { role: "guest", resource: "courses", resourceId: "*", actions: ["read"] },
];

const defaultConfigs = [
  { key: "compiler", value: { languages: { python: { enabled: true, memoryMb: 256, timeoutMs: 8000 }, cpp: { enabled: true, memoryMb: 512, timeoutMs: 12000 }, javascript: { enabled: true, memoryMb: 256, timeoutMs: 8000 } }, defaultTimeoutMs: 10000, defaultMemoryMb: 256 } },
  { key: "ai", value: { provider: "nvidia", model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-ultra-550b-a55b", baseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1", maxTokens: 4096, temperature: 0.7, topP: 0.95, enabled: true, rateLimitPerMinute: 10, hasApiKey: !!process.env.NVIDIA_API_KEY } },
  { key: "platform", value: { siteName: "Socratica AI", maintenanceMode: false, allowRegistration: true, defaultRole: "student", sessionDurationHours: 24 } },
];

async function seedConfigs() {
  let created = 0;
  for (const cfg of defaultConfigs) {
    const existing = await SystemConfig.findOne({ key: cfg.key });
    if (!existing) {
      await SystemConfig.create(cfg);
      created++;
    }
  }
  if (created) console.log(`[seedConfigs] ${created} configs created`);
}

async function seedPermissions() {
  let created = 0;
  let skipped = 0;

  for (const perm of defaults) {
    const existing = await Permission.findOne({
      role: perm.role,
      resource: perm.resource,
      resourceId: perm.resourceId,
    });
    if (existing) {
      skipped++;
    } else {
      await Permission.create(perm);
      created++;
    }
  }

  console.log(`[seedPermissions] ${created} created, ${skipped} already exist`);
  await seedConfigs();
}

module.exports = seedPermissions;
module.exports.seedConfigs = seedConfigs;
