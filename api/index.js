const app = require('../server/server');
const mongoose = require('mongoose');

let connecting = null;
let dbConnected = false;
let lastDbError = null;

async function ensureDb() {
  if (mongoose.connection.readyState === 1) { dbConnected = true; return; }
  if (connecting) return connecting;
  dbConnected = false;
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/socratica';
  connecting = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  }).then(() => {
    dbConnected = true;
    connecting = null;
    lastDbError = null;
    console.log('[vercel] DB connected');
  }).catch(err => {
    connecting = null;
    lastDbError = { name: err.name, message: err.message, code: err.code };
    console.error('[vercel] DB error:', err.name, err.message);
  });
  return connecting;
}

module.exports = async (req, res) => {
  await ensureDb();
  res.setHeader('x-db-state', dbConnected ? 'connected' : 'disconnected');
  if (lastDbError) {
    res.setHeader('x-db-error', lastDbError.name + ': ' + lastDbError.message.substring(0, 120));
  }
  return app(req, res);
};
