// models/Questions.js
const mongoose = require("mongoose");
const answerSchema = require("./Answer");

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    body: { type: String, required: true, trim: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{ type: String, index: true }],
    answers: [answerSchema],
    upvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: { type: Number, default: 0 },
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      default: null,
    },
  },
  { timestamps: true }
);

// Virtuals
questionSchema.virtual("upvotes").get(function () {
  return this.upvoters?.length || 0;
});

questionSchema.virtual("downvotes").get(function () {
  return this.downvoters?.length || 0;
});

questionSchema.virtual("score").get(function () {
  return (this.upvoters?.length || 0) - (this.downvoters?.length || 0);
});

// Enable virtuals in output
questionSchema.set("toObject", { virtuals: true });
questionSchema.set("toJSON", { virtuals: true });

// Text index for search (title + body + tags)
questionSchema.index({ title: "text", body: "text", tags: "text" });

module.exports = mongoose.model("Question", questionSchema, "questions");
