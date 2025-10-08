const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    upvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: null },
  },
  { _id: true }
);

// Virtual: votes = upvotes - downvotes
answerSchema.virtual("votes").get(function () {
  return (this.upvoters?.length || 0) - (this.downvoters?.length || 0);
});

// Enable virtuals in output
answerSchema.set("toObject", { virtuals: true });
answerSchema.set("toJSON", { virtuals: true });

module.exports = answerSchema;
