/**
 * localUserStore.js
 * Simple file-based user store used when MongoDB is unavailable.
 * Users are stored in server/local_users.json
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORE_PATH = path.join(__dirname, "local_users.json");

function load() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    }
  } catch (e) {
    console.warn("[localUserStore] Could not read store:", e.message);
  }
  return {};
}

function save(users) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(users, null, 2), "utf8");
  } catch (e) {
    console.warn("[localUserStore] Could not save store:", e.message);
  }
}

const LocalUserStore = {
  findByEmail(email) {
    const users = load();
    return users[email.toLowerCase().trim()] || null;
  },

  findById(id) {
    const users = load();
    return Object.values(users).find((u) => u._id === id) || null;
  },

  create({ email, passwordHash, displayName }) {
    const users = load();
    const normalizedEmail = email.toLowerCase().trim();
    if (users[normalizedEmail]) return null; // already exists
    const user = {
      _id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      displayName: displayName || normalizedEmail.split("@")[0],
      role: Object.keys(users).length === 0 ? "admin" : "student",
      emailVerified: true,
      tokenVersion: 0,
      createdAt: new Date().toISOString(),
    };
    users[normalizedEmail] = user;
    save(users);
    return user;
  },

  updateLastLogin(email) {
    const users = load();
    const normalizedEmail = email.toLowerCase().trim();
    if (users[normalizedEmail]) {
      users[normalizedEmail].lastLoginAt = new Date().toISOString();
      save(users);
    }
  },
};

module.exports = LocalUserStore;
