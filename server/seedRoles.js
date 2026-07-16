// Seed Roles — populates Role collection with default roles.
const Role = require("./models/Role");

const DEFAULT_ROLES = [
  {
    name: "super_admin",
    displayName: "Super Admin",
    description: "Full system access. Can manage all users, config, and security.",
    permissions: ["*"],
    config: { aiRateLimit: 200, aiWindowMs: 60000, maxSubmissionsPerDay: 9999 },
    order: 0,
  },
  {
    name: "admin",
    displayName: "Admin",
    description: "Platform administration. Manages users, courses, and content.",
    permissions: ["users:read", "users:update", "courses:*", "modules:*", "problems:*", "notifications:*", "permissions:read", "analytics:read", "compiler:read", "compiler:update"],
    config: { aiRateLimit: 100, aiWindowMs: 60000, maxSubmissionsPerDay: 9999 },
    order: 1,
  },
  {
    name: "instructor",
    displayName: "Instructor",
    description: "Course instructor. Creates content and views student insights.",
    permissions: ["courses:read", "modules:read", "problems:read", "analytics:read"],
    config: { aiRateLimit: 50, aiWindowMs: 60000, maxSubmissionsPerDay: 500 },
    order: 2,
  },
  {
    name: "student",
    displayName: "Student",
    description: "Regular student. Solves problems, gets AI hints, tracks progress.",
    permissions: ["courses:read", "modules:read", "problems:read"],
    config: { aiRateLimit: 30, aiWindowMs: 60000, maxSubmissionsPerDay: 100 },
    order: 3,
  },
  {
    name: "guest",
    displayName: "Guest",
    description: "Unauthenticated visitor. Limited AI access, no persistence.",
    permissions: [],
    config: { aiRateLimit: 5, aiWindowMs: 60000, maxSubmissionsPerDay: 0 },
    order: 4,
  },
];

async function seedRoles() {
  let created = 0;
  let updated = 0;

  for (const role of DEFAULT_ROLES) {
    const existing = await Role.findOne({ name: role.name });
    if (existing) {
      await Role.updateOne({ name: role.name }, { $set: role });
      updated++;
    } else {
      await Role.create(role);
      created++;
    }
  }

  console.log(`[seedRoles] Created: ${created}, Updated: ${updated}`);
  return { created, updated };
}

module.exports = seedRoles;
