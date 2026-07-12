/**
 * Migration: Convert String userId fields to ObjectId across all collections.
 *
 * Run: node scripts/migrate-userIds.js
 * Requires: MONGO_URI env var or a running MongoDB at default URI
 */
const mongoose = require('mongoose');

async function migrate() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/socratica';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`Connected to ${uri}`);

  const collections = ['submissions', 'sessions', 'auditlogs', 'enrollments'];
  let totalFixed = 0;

  for (const collName of collections) {
    const coll = db.collection(collName);
    const docs = await coll.find({ userId: { $type: 'string' } }).toArray();
    if (docs.length === 0) { console.log(`${collName}: no string userIds to fix`); continue; }

    const ops = docs.map(doc => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { userId: new mongoose.Types.ObjectId(doc.userId) } },
      },
    }));
    await coll.bulkWrite(ops);
    console.log(`${collName}: fixed ${docs.length} documents`);
    totalFixed += docs.length;
  }

  console.log(`\nDone. ${totalFixed} total documents migrated.`);
  await mongoose.disconnect();
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
