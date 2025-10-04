// models/Comment.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  body: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
  answerId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
  userVotes: { 
    type: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, vote: Number }], 
    default: [] 
  },
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);
