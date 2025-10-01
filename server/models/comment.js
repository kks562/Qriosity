const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    body: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "parentType" },
    parentType: { type: String, required: true, enum: ["Question", "Answer"] },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
