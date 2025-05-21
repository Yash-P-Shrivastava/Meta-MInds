const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Interview Session Schema
const InterviewSessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const InterviewSession = mongoose.model('InterviewSession', InterviewSessionSchema);
module.exports = InterviewSession;