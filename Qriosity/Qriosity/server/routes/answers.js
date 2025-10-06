const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Question = require("../models/Questions");
const auth = require("../middleware/auth");
const { awardBadges } = require("../services/badgeService");
const User = require("../models/User");

// ========================
// Add answer
// ========================
router.post("/:questionId", auth, async (req, res) => {
  const { questionId } = req.params;
  const { body } = req.body;
  if (!body) return res.status(400).json({ msg: "Answer body required" });
  if (!mongoose.Types.ObjectId.isValid(questionId))
    return res.status(400).json({ msg: "Invalid questionId" });

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    const answer = {
      _id: new mongoose.Types.ObjectId(),
      body,
      author: req.user.id,
      createdAt: new Date(),
      upvoters: [],
      downvoters: [],
    };

    question.answers.push(answer);
    await question.save();

    // Populate author for the new answer
    const populatedQuestion = await Question.findById(questionId)
      .populate({ path: "answers.author", select: "name" });

    const created = populatedQuestion.answers.id(answer._id);
    res.status(201).json(created);
  } catch (err) {
    console.error("Add answer error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ========================
// Delete answer
// ========================
router.delete("/:questionId/:answerId", auth, async (req, res) => {
  const { questionId, answerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId))
    return res.status(400).json({ msg: "Invalid ID(s)" });

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    const answer = question.answers.id(answerId);
    if (!answer) return res.status(404).json({ msg: "Answer not found" });
    if (String(answer.author) !== req.user.id) return res.status(403).json({ msg: "Not authorized" });

    question.answers.pull(answerId);
    await question.save();

    res.json({ msg: "Answer deleted successfully" });
  } catch (err) {
    console.error("Delete answer error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ========================
// Vote answer
// ========================
router.patch("/:questionId/:answerId/vote", auth, async (req, res) => {
  const { questionId, answerId } = req.params;
  const { vote } = req.body; // 1, -1, or 0 (newly supported)

  if (![1, -1, 0].includes(vote))
    return res.status(400).json({ msg: "Vote must be 1, -1, or 0" });
  if (
    !mongoose.Types.ObjectId.isValid(questionId) ||
    !mongoose.Types.ObjectId.isValid(answerId)
  )
    return res.status(400).json({ msg: "Invalid ID(s)" });

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    const answer = question.answers.id(answerId);
    if (!answer) return res.status(404).json({ msg: "Answer not found" });

    const author = await User.findById(answer.author);

    // ALWAYS Remove existing vote first (handles unvoting/switching)
    const wasUpvoted = answer.upvoters.includes(req.user.id);
    const wasDownvoted = answer.downvoters.includes(req.user.id);

    if (wasUpvoted) {
      answer.upvoters = answer.upvoters.filter(
        (u) => u.toString() !== req.user.id
      );
      if (author) author.reputation -= 10;
    }
    if (wasDownvoted) {
      answer.downvoters = answer.downvoters.filter(
        (u) => u.toString() !== req.user.id
      );
      if (author) author.reputation += 2;
    }

    // Apply new vote only if vote is 1 or -1. If vote is 0, we stop here (unvote complete).
    if (vote === 1) {
      answer.upvoters.push(req.user.id);
      if (author) author.reputation += 10;
    }
    if (vote === -1) {
      answer.downvoters.push(req.user.id);
      if (author) author.reputation -= 2;
    }

    await question.save();
    if (author) {
      await author.save();
      await awardBadges(author._id);
    }

    // Populate author before returning
    const populatedQuestion = await Question.findById(questionId).populate({
      path: "answers.author",
      select: "name",
    });

    const updatedAnswer = populatedQuestion.answers.id(answerId);

    // Prepare the final response object with calculated upvotes/downvotes
    res.json({
      ...updatedAnswer.toObject(),
      upvotes: updatedAnswer.upvoters.length,
      downvotes: updatedAnswer.downvoters.length,
      votes: updatedAnswer.upvoters.length - updatedAnswer.downvoters.length,
    });
  } catch (err) {
    console.error("Answer vote error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ========================
// Accept Answer
// ========================
router.patch("/:questionId/:answerId/accept", auth, async (req, res) => {
  const { questionId, answerId } = req.params;

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    // Only question author can accept an answer
    if (question.author.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    question.acceptedAnswer = answerId;
    await question.save();

    const answer = question.answers.id(answerId);
    const answerAuthor = await User.findById(answer.author);

    if (answerAuthor) {
      answerAuthor.reputation += 15;
      await answerAuthor.save();
      await awardBadges(answerAuthor._id);
    }

    res.json(question);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


module.exports = router;
