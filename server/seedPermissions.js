const Permission = require("./models/Permission");
const SystemConfig = require("./models/SystemConfig");
const config = require("./config");

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
  { role: "admin", resource: "notifications", resourceId: "*", actions: ["create", "read", "delete"] },

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
  { key: "compiler", value: { languages: { python: { enabled: true, memoryMb: config.sandbox.languages.python.memoryMb, timeoutMs: config.sandbox.languages.python.timeoutMs }, cpp: { enabled: true, memoryMb: config.sandbox.languages.cpp.memoryMb, timeoutMs: config.sandbox.languages.cpp.timeoutMs }, javascript: { enabled: true, memoryMb: config.sandbox.languages.javascript.memoryMb, timeoutMs: config.sandbox.languages.javascript.timeoutMs } }, defaultTimeoutMs: 10000, defaultMemoryMb: 256 } },
  { key: "ai", value: { provider: "nvidia", model: process.env.NVIDIA_MODEL || config.llm.model, baseUrl: process.env.NVIDIA_BASE_URL || config.llm.baseUrl, maxTokens: config.llm.maxTokens, temperature: config.llm.temperature, topP: config.llm.topP, enabled: true, rateLimitPerMinute: config.rateLimits.compiler.max, hasApiKey: !!process.env.NVIDIA_API_KEY } },
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
  let updated = 0;
  let skipped = 0;

  for (const perm of defaults) {
    const existing = await Permission.findOne({
      role: perm.role,
      resource: perm.resource,
      resourceId: perm.resourceId,
    });
    if (existing) {
      const needsUpdate = JSON.stringify(existing.actions.sort()) !== JSON.stringify(perm.actions.sort());
      if (needsUpdate) {
        existing.actions = perm.actions;
        await existing.save();
        updated++;
      } else {
        skipped++;
      }
    } else {
      await Permission.create(perm);
      created++;
    }
  }

  console.log(`[seedPermissions] ${created} created, ${updated} updated, ${skipped} unchanged`);
  await seedConfigs();
}

module.exports = seedPermissions;
module.exports.seedConfigs = seedConfigs;
