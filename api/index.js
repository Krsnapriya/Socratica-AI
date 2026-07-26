const app = require("../server/server");

// connectDB and autoSeed are exported so we can call them here
const { connectDB, autoSeed } = require("../server/server");

let initialized = false;
let initPromise = null;

async function initialize() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await connectDB();
      await autoSeed();
      initialized = true;
    } catch (err) {
      console.error("[vercel] Initialization error:", err.message);
      initPromise = null; // allow retry on next request
    }
  })();

  return initPromise;
}

module.exports = async (req, res) => {
  await initialize();
  return app(req, res);
};
