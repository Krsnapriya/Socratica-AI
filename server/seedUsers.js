require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const config = require("./config");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

const testUsers = [
  { email: config.seed.emails.super_admin || "super@socratica.ai", role: "super_admin", displayName: "Super Admin" },
  { email: config.seed.emails.admin || "admin@socratica.ai", role: "admin", displayName: "System Admin" },
  { email: config.seed.emails.instructor || "instructor@socratica.ai", role: "instructor", displayName: "Instructor Jane" },
  { email: config.seed.emails.student || "student@socratica.ai", role: "student", displayName: "Student Bob" },
  { email: config.seed.emails.guest || "guest@socratica.ai", role: "guest", displayName: "Guest User" },
];

async function seedUsers() {
  try {
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = process.env.SEED_USER_PASSWORD || "SocraticaSeed123!";
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    let createdCount = 0;
    for (const u of testUsers) {
      const email = u.email.toLowerCase().trim();
      const existing = await User.findOne({ email });
      if (!existing) {
        await User.create({
          email,
          passwordHash,
          displayName: u.displayName,
          role: u.role
        });
        createdCount++;
        console.log(`[seedUsers] Created ${u.role}: ${email}`);
      } else {
        existing.passwordHash = passwordHash;
        existing.role = u.role;
        await existing.save();
        console.log(`[seedUsers] Updated credentials for ${u.role}: ${email}`);
      }
    }

    console.log(`[seedUsers] Done seeding users (created ${createdCount}).`);
    return { created: createdCount };
  } catch (err) {
    console.error("[seedUsers] Error:", err.message);
    throw err;
  }
}

module.exports = seedUsers;

if (require.main === module) {
  (async () => {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI);
      }
      await seedUsers();
    } catch (err) {
      console.error(err);
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  })();
}
