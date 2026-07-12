require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/socratica";

const testUsers = [
  { email: "super@socratica.ai", role: "super_admin", displayName: "Super Admin" },
  { email: "admin@socratica.ai", role: "admin", displayName: "System Admin" },
  { email: "instructor@socratica.ai", role: "instructor", displayName: "Instructor Jane" },
  { email: "student@socratica.ai", role: "student", displayName: "Student Bob" },
  { email: "guest@socratica.ai", role: "guest", displayName: "Guest User" }
];

async function seedUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = process.env.SEED_USER_PASSWORD || "SocraticaSeed123!";
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    for (const u of testUsers) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        await User.create({
          email: u.email,
          passwordHash,
          displayName: u.displayName,
          role: u.role
        });
        console.log(`Created ${u.role}: ${u.email}`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }

    console.log("Done seeding users.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedUsers();
