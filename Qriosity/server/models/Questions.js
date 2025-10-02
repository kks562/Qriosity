const mongoose = require("mongoose");

// =========================
// Answer Schema (subdocument)
// =========================
const answerSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    votes: { type: Number, default: 0 },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// =========================
// Question Schema (main)
// =========================
const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: { type: [String], default: [] },
    answers: [answerSchema], // embedded answers
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    upvotes: { type: Number, default: 0 },
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// =========================
// Text Index for Search
// =========================
questionSchema.index({ title: "text", body: "text", tags: "text" });

// =========================
// Middleware: Cascade delete
// =========================
questionSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const Comment = mongoose.model("Comment");

    // Delete question's comments
    if (this.comments?.length) {
      await Comment.deleteMany({ _id: { $in: this.comments } });
    }

    // Delete all comments in answers
    for (const ans of this.answers) {
      if (ans.comments?.length) {
        await Comment.deleteMany({ _id: { $in: ans.comments } });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Question", questionSchema);
