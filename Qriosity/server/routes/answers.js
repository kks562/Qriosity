const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Question = require("../models/Questions");
const authMiddleware = require("../middleware/auth");

// Add an answer to a question
router.post("/:questionId", authMiddleware, async (req, res) => {
  const { body } = req.body;
  const { questionId } = req.params;

  if (!body) return res.status(400).json({ msg: "Answer body is required" });
  if (!mongoose.Types.ObjectId.isValid(questionId))
    return res.status(400).json({ msg: "Invalid Question ID" });

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    const newAnswer = { body, author: req.user.id };
    question.answers.push(newAnswer);
    await question.save();

    const savedAnswer = question.answers[question.answers.length - 1];
    await savedAnswer.populate("author", "name");

    res.status(201).json({ ...savedAnswer.toObject(), questionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete an answer (subdocument)
router.delete("/:questionId/:answerId", authMiddleware, async (req, res) => {
  const { questionId, answerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ msg: "Invalid ID(s)" });
  }

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    const answer = question.answers.id(answerId);
    if (!answer) return res.status(404).json({ msg: "Answer not found" });

    if (answer.author.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized to delete this answer" });
    }

    // Correct way: remove subdocument
    question.answers.pull(answerId);
    await question.save();

    res.json({ msg: "Answer deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.patch('/:questionId/:answerId/vote', authMiddleware, async (req, res) => {
  const { questionId, answerId } = req.params;
  const { vote } = req.body; // +1 or -1

  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ msg: 'Invalid ID' });
  }

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ msg: 'Question not found' });

    const answer = question.answers.id(answerId);
    if (!answer) return res.status(404).json({ msg: 'Answer not found' });

    // Update votes
    answer.votes = (answer.votes || 0) + (vote === 1 ? 1 : vote === -1 ? -1 : 0);

    await question.save();
    res.json({ msg: 'Vote updated', votes: answer.votes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Vote an answer
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  // ✅ Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid Question ID" });
  }

  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ msg: "Question not found" });
    }

    // ✅ Ensure author exists and matches logged-in user
    if (!question.author || String(question.author) !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized to delete this question" });
    }

    // ✅ Delete question
    await question.deleteOne();

    res.json({ msg: "Question deleted successfully" });
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;
