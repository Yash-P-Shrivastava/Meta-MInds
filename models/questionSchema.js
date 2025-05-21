const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
  session: {
    type: Schema.Types.ObjectId,
    ref: 'InterviewSession',
    required: true
  },
  questionText: {
    type: [String], // Changed from String to [String]
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0 && arr.every(item => typeof item === 'string' && item.trim() !== '');
      },
      message: 'questionText must be a non-empty array of non-empty strings'
    }
  },
  questionOrder: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Question', QuestionSchema);