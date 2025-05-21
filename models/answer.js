const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnswerSchema = new Schema({
  session: {
    type: Schema.Types.ObjectId,
    ref: 'InterviewSession',
    required: true
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answerText: {
    type: [String], // Changed from String to [String]
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0 && arr.every(item => typeof item === 'string' && item.trim() !== '');
      },
      message: 'answerText must be a non-empty array of non-empty strings'
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Answer', AnswerSchema);