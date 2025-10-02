const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true } // Each answer has its own _id
);

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: { type: [String], default: [] },
    answers: [answerSchema], // Use sub-schema for answers
    upvotes: { type: Number, default: 0 }, // Removed min: 0 to allow negative votes
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
