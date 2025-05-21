const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResultAnalysisSchema = new Schema({
  session: {
    type: Schema.Types.ObjectId,
    ref: 'InterviewSession',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analysis: {
    type: Object,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  answeredQuestions: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ResultAnalysis', ResultAnalysisSchema);
