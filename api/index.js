require("dotenv").config({ path: require("path").join(__dirname, "../server/.env") });

const serverModule = require("../server/server");
const app = serverModule;
const connectDB = serverModule.connectDB;

// Cache the DB connection across warm invocations (Vercel reuses function instances)
let dbReady = false;

module.exports = async (req, res) => {
  if (!dbReady) {
    try {
      await connectDB();
      dbReady = true;
    } catch (err) {
      console.error("[vercel/api] DB connection failed:", err.message);
      // Still try to handle the request — some routes may not need DB
    }
  }
  return app(req, res);
};
