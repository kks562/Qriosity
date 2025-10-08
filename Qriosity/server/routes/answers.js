const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Question = require("../models/Questions");
const auth = require("../middleware/auth");
const { awardBadges } = require("../services/badgeService");
const { createNotification } = require("../services/notificationService"); // <-- imported
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

    // Create notification for question author
    await createNotification({
      user: question.author,
      sender: req.user.id,
      type: "answer",
      message: `answered your question: "${question.title}"`,
      question: question._id,
      answer: answer._id,
    });

    // Populate author for the new answer
    const populatedQuestion = await Question.findById(questionId).populate({
      path: "answers.author",
      select: "name",
    });

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
  const { vote } = req.body; // 1, -1, or 0

  if (![1, -1, 0].includes(vote))
    return res.status(400).json({ msg: "Vote must be 1, -1, or 0" });
  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId))
    return res.status(400).json({ msg: "Invalid ID(s)" });

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    const answer = question.answers.id(answerId);
    if (!answer) return res.status(404).json({ msg: "Answer not found" });

    const author = await User.findById(answer.author);

    // Remove existing vote first
    const wasUpvoted = answer.upvoters.includes(req.user.id);
    const wasDownvoted = answer.downvoters.includes(req.user.id);

    if (wasUpvoted) {
      answer.upvoters = answer.upvoters.filter(u => u.toString() !== req.user.id);
      if (author) author.reputation -= 10;
    }
    if (wasDownvoted) {
      answer.downvoters = answer.downvoters.filter(u => u.toString() !== req.user.id);
      if (author) author.reputation += 2;
    }

    // Apply new vote
    if (vote === 1) {
      answer.upvoters.push(req.user.id);
      if (author) author.reputation += 10;

      // Notification for upvote
      await createNotification({
        user: answer.author,
        sender: req.user.id,
        type: "upvote",
        message: `upvoted your answer on question: "${question.title}"`,
        question: question._id,
        answer: answer._id,
      });
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

    const populatedQuestion = await Question.findById(questionId).populate({
      path: "answers.author",
      select: "name",
    });
    const updatedAnswer = populatedQuestion.answers.id(answerId);

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

      // Notification for accepted answer
      await createNotification({
        user: answerAuthor._id,
        sender: req.user.id,
        type: "accepted",
        message: `accepted your answer on question: "${question.title}"`,
        question: question._id,
        answer: answer._id,
      });
    }

    res.json(question);
  } catch (err) {
    console.error("Accept answer error:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
