// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // recipient
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who triggered
    type: { type: String, required: true }, // 'answer', 'comment', 'accepted', 'upvote'
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" }, // optional
    answer: { type: mongoose.Schema.Types.ObjectId }, // optional answer _id
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" }, // optional
    message: { type: String },
    read: { type: Boolean, default: false },
    answerBody: { type: String }, // store answer text for convenience
  },
  { timestamps: true }
);

// index for faster lookups
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
