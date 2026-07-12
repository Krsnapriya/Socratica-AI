const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  problemId: { type: String, required: true, index: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  roundCount: { type: Number, default: 1, min: 1, max: 5 },
  finalVerdict: {
    type: String,
    enum: ['pass', 'fail', 'abandoned', 'max_attempts_reached'],
  },
});

module.exports = mongoose.model('Session', sessionSchema);
