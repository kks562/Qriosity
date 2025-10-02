const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Question = require("../models/Questions");
const Answer = require("../models/Answer");
const authMiddleware = require("../middleware/auth");

// GET comments for a parent (Question or Answer)
router.get("/:parentId", async (req, res) => {
  try {
    const { parentId } = req.params;
    const comments = await Comment.find({ parentId }).populate("authorId", "name");
    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST a comment
router.post("/", authMiddleware, async (req, res) => {
  const { body, parentId, parentType } = req.body;
  if (!body || !parentId || !["Question", "Answer"].includes(parentType))
    return res.status(400).json({ msg: "Invalid request" });

  try {
    if (parentType === "Question") {
      const parent = await Question.findById(parentId);
      if (!parent) return res.status(404).json({ msg: "Question not found" });

      const comment = new Comment({
        body,
        parentId,
        parentType,
        authorId: req.user.id,
      });
      await comment.save();

      parent.comments = parent.comments || [];
      parent.comments.push(comment._id);
      await parent.save();

      await comment.populate("authorId", "name");
      return res.status(201).json(comment);

    } else if (parentType === "Answer") {
      // Find the question containing this answer
      const question = await Question.findOne({ "answers._id": parentId });
      if (!question) return res.status(404).json({ msg: "Answer not found" });

      const answer = question.answers.id(parentId);
      if (!answer) return res.status(404).json({ msg: "Answer not found" });

      const comment = new Comment({
        body,
        parentId,
        parentType,
        authorId: req.user.id,
      });
      await comment.save();

      answer.comments = answer.comments || [];
      answer.comments.push(comment._id);
      await question.save();

      await comment.populate("authorId", "name");
      return res.status(201).json(comment);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;
