const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Comment = require("../models/Comment");
const Question = require("../models/Questions");
const auth = require("../middleware/auth");
const { createNotification } = require("../services/notificationService"); // added

// ==============================
// Vote a comment
// ==============================
router.patch("/:commentId/vote", auth, async (req, res) => {
  const { commentId } = req.params;
  const { vote } = req.body; // 1, -1, or 0

  if (![1, -1, 0].includes(vote))
    return res.status(400).json({ msg: "Vote must be 1, -1, or 0" });

  if (!mongoose.Types.ObjectId.isValid(commentId))
    return res.status(400).json({ msg: "Invalid commentId" });

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    comment.userVotes = comment.userVotes || [];

    const existingVoteIndex = comment.userVotes.findIndex(
      u => u.user.toString() === req.user.id
    );

    if (existingVoteIndex > -1) {
      const existingVoteValue = comment.userVotes[existingVoteIndex].vote;

      if (existingVoteValue === vote || vote === 0) {
        comment.userVotes.splice(existingVoteIndex, 1);
      } else {
        comment.userVotes[existingVoteIndex].vote = vote;
      }
    } else if (vote !== 0) {
      comment.userVotes.push({ user: req.user.id, vote });
    }

    await comment.save();

    // Notify comment author if upvoted
    if (vote === 1) {
      await createNotification({
        user: comment.author,
        sender: req.user.id,
        type: "upvote",
        message: `upvoted your comment`,
        comment: comment._id,
        question: comment.questionId,
        answer: comment.answerId,
      });
    }

    const populated = await comment.populate("author", "name");
    res.json(populated.toObject());
  } catch (err) {
    console.error("Comment vote error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ==============================
// Get comments for a question or answer
// ==============================
router.get("/:parentId", async (req, res) => {
  const { parentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(parentId))
    return res.status(400).json({ msg: "Invalid ID" });

  try {
    const comments = await Comment.find({
      $or: [{ questionId: parentId }, { answerId: parentId }],
    })
      .sort({ createdAt: -1 })
      .populate("author", "name");

    res.json(comments);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ==============================
// Add a comment
// ==============================
router.post("/", auth, async (req, res) => {
  let { parentId, body, type, parentCommentId } = req.body;

  if (!parentId || !body || !type)
    return res.status(400).json({ msg: "parentId, body and type required" });

  type = type.toLowerCase();
  if (!["question", "answer"].includes(type))
    return res.status(400).json({ msg: "type must be 'question' or 'answer'" });

  if (!mongoose.Types.ObjectId.isValid(parentId))
    return res.status(400).json({ msg: "Invalid parentId" });

  if (parentCommentId && !mongoose.Types.ObjectId.isValid(parentCommentId))
    return res.status(400).json({ msg: "Invalid parentCommentId" });

  try {
    if (type === "question") {
      const q = await Question.findById(parentId);
      if (!q) return res.status(404).json({ msg: "Question not found" });
    } else {
      const q = await Question.findOne({ "answers._id": parentId });
      if (!q) return res.status(404).json({ msg: "Answer not found" });
    }

    const comment = new Comment({
      body,
      author: req.user.id,
      questionId: type === "question" ? parentId : null,
      answerId: type === "answer" ? parentId : null,
      parentCommentId: parentCommentId || null,
    });

    const saved = await comment.save();
    await saved.populate("author", "name");

    // Notify parent author
    const parentUserId = type === "question" ? saved.questionId : saved.answerId;
    if (parentUserId && saved.author.toString() !== req.user.id) {
      await createNotification({
        user: type === "question" ? (await Question.findById(saved.questionId)).author : (await Question.findOne({ "answers._id": saved.answerId }, { "answers.$": 1 })).answers[0].author,
        sender: req.user.id,
        type: "comment",
        message: `commented on your ${type}`,
        comment: saved._id,
        question: saved.questionId,
        answer: saved.answerId,
      });
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ==============================
// Delete comment
// ==============================
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid ID" });

  try {
    const c = await Comment.findById(id);
    if (!c) return res.status(404).json({ msg: "Comment not found" });
    if (String(c.author) !== String(req.user.id)) return res.status(403).json({ msg: "Not authorized" });

    await c.deleteOne();
    await Comment.deleteMany({ parentCommentId: id }); // remove replies
    res.json({ msg: "Comment deleted" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
