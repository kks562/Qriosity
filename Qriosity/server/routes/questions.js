const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Question = require('../models/Questions');
const authMiddleware = require('../middleware/auth');

// ==============================
// Robust Search questions (Live Suggestions)
// ==============================
router.get('/search', async (req, res) => {
  try {
    const { query = "", tags = "", sort = "date", limit = 10 } = req.query;
    const filter = {};

    // Partial match for live search
    if (query && query.trim()) {
      filter.title = { $regex: query.trim(), $options: "i" }; // case-insensitive
    }

    // Tags filter
    const tagsArray = Array.isArray(tags)
      ? tags
      : (tags || "").split(",").map((t) => t.trim()).filter(Boolean);

    if (tagsArray.length > 0) {
      filter.tags = { $in: tagsArray };
    }

    // Sort option
    const sortOption =
      sort === "popularity" ? { upvotes: -1, createdAt: -1 } : { createdAt: -1 };

    const questions = await Question.find(filter)
      .sort(sortOption)
      .limit(parseInt(limit))
      .populate("author", "name")
      .populate({ path: "answers.author", select: "name" });

    res.json(questions);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ==============================
// Get all questions
// ==============================
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find()
      .sort({ createdAt: -1 })
      .populate("author", "name")
      .populate({ path: "answers.author", select: "name" });
    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ==============================
// Get a single question + increment views
// ==============================
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ msg: "Invalid Question ID" });

  try {
    const question = await Question.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("author", "name")
      .populate({ path: "answers.author", select: "name" });

    if (!question) return res.status(404).json({ msg: "Question not found" });

    res.json(question);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ==============================
// Create a new question
// ==============================
router.post("/", authMiddleware, async (req, res) => {
  const { title, body, tags } = req.body;
  if (!title || !body) return res.status(400).json({ msg: "Title and body are required" });

  try {
    const newQuestion = new Question({
      title,
      body,
      author: req.user.id,
      tags: Array.isArray(tags) ? tags : (tags || "").split(",").map(tag => tag.trim()),
    });

    const question = await newQuestion.save();
    const populated = await Question.findById(question._id).populate("author", "name");
    res.status(201).json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ==============================
// Add an answer to a question
// ==============================
router.post("/:id/answer", authMiddleware, async (req, res) => {
  const { body } = req.body;
  const { id } = req.params;

  if (!body) return res.status(400).json({ msg: "Answer body is required" });
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid Question ID" });

  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    const newAnswer = { body, author: req.user.id };
    question.answers.push(newAnswer);
    await question.save();

    const savedAnswer = question.answers[question.answers.length - 1];
    res.status(201).json({ ...savedAnswer.toObject(), questionId: id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ==============================
// Delete a question
// ==============================
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid Question ID" });

  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    if (!question.author || question.author.toString() !== req.user.id)
      return res.status(403).json({ msg: "Not authorized to delete this question" });

    await question.deleteOne();
    res.json({ msg: "Question deleted successfully" });
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ==============================
// Vote a question
// ==============================
router.patch("/:id/vote", authMiddleware, async (req, res) => {
  const { vote } = req.body; // 1 or -1
  const { id } = req.params;

  if (![1, -1].includes(vote)) return res.status(400).json({ msg: "Vote must be 1 or -1" });
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid Question ID" });

  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    question.upvotes = (question.upvotes || 0) + vote;
    await question.save();

    res.json(question);
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
