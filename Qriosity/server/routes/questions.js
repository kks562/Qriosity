const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Question = require("../models/Questions");
const auth = require("../middleware/auth");
const { awardBadges } = require("../services/badgeService");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService"); // <-- added

// ==============================
// Vote an answer
// ==============================
router.patch("/:questionId/answer/:answerId/vote", auth, async (req, res) => {
  const { questionId, answerId } = req.params;
  const { vote } = req.body; // 1, -1, or 0

  if (![1, -1, 0].includes(vote)) return res.status(400).json({ msg: "Vote must be 1, -1, or 0" });
  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId))
    return res.status(400).json({ msg: "Invalid IDs" });

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    const answer = question.answers.id(answerId);
    if (!answer) return res.status(404).json({ msg: "Answer not found" });

    if (!answer.userVotes) answer.userVotes = [];

    // Remove existing vote if toggling to 0
    answer.userVotes = answer.userVotes.filter(v => v.user.toString() !== req.user.id);

    if (vote !== 0) {
      answer.userVotes.push({ user: req.user.id, vote });

      if (vote === 1) {
        // Notify answer author on upvote
        await createNotification({
          user: answer.author,
          sender: req.user.id,
          type: "upvote",
          message: `upvoted your answer on question: "${question.title}"`,
          question: question._id,
          answer: answer._id,
        });
      }
    }

    await question.save();

    const updatedAnswer = question.answers.id(answerId);
    await Question.populate(updatedAnswer, { path: "author", select: "name" });

    res.json(updatedAnswer);
  } catch (err) {
    console.error("Vote answer error:", err);
    res.status(500).json({ msg: "Server error" });
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
      .populate("answers.author", "name");

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ==============================
// Search / autosuggest
// ==============================
router.get("/search", async (req, res) => {
  try {
    const { title, tags, sort } = req.query;
    const query = {};

    if (title) query.$text = { $search: title };
    if (tags) query.tags = { $in: tags.split(",").map(t => t.trim()) };

    let sortOption = { createdAt: -1 };
    if (sort === "votes") sortOption = { upvoters: -1, downvoters: 1 };

    const questions = await Question.find(query)
      .sort(sortOption)
      .limit(50)
      .populate("author", "name");

    res.json(questions);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ msg: "Search failed" });
  }
});

// ==============================
// Get single question + increment views
// ==============================
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid ID" });

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
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ==============================
// Create question
// ==============================
router.post("/", auth, async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    if (!title || !body) return res.status(400).json({ msg: "Title and body required" });

    const tagsArray = Array.isArray(tags)
      ? tags
      : (tags || "").split(",").map(t => t.trim()).filter(Boolean);

    const q = new Question({
      title,
      body,
      tags: tagsArray,
      author: req.user.id,
    });

    const saved = await q.save();
    const populated = await Question.findById(saved._id).populate("author", "name");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create question error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ==============================
// Delete question
// ==============================
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid ID" });

  try {
    const q = await Question.findById(id);
    if (!q) return res.status(404).json({ msg: "Question not found" });
    if (String(q.author) !== String(req.user.id)) return res.status(403).json({ msg: "Not authorized" });

    await q.deleteOne();
    res.json({ msg: "Question deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ==============================
// Vote a question
// ==============================
router.patch("/:id/vote", auth, async (req, res) => {
  const { vote } = req.body; // 1 = upvote, -1 = downvote, 0 = remove vote
  if (![1, -1, 0].includes(vote)) return res.status(400).json({ msg: "Vote must be 1, -1, or 0" });

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "Invalid Question ID" });

  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    const userId = req.user.id;
    const author = await User.findById(question.author);

    // Remove previous vote
    const wasUpvoted = question.upvoters.includes(userId);
    const wasDownvoted = question.downvoters.includes(userId);

    if (wasUpvoted) {
      question.upvoters.pull(userId);
      if (author) author.reputation -= 10;
    }
    if (wasDownvoted) {
      question.downvoters.pull(userId);
      if (author) author.reputation += 2;
    }

    // Apply new vote if vote is 1 or -1
    if (vote === 1) {
      question.upvoters.push(userId);
      if (author) author.reputation += 10;

      // Notification for upvote
      await createNotification({
        user: question.author,
        sender: req.user.id,
        type: "upvote",
        message: `upvoted your question: "${question.title}"`,
        question: question._id,
      });
    } else if (vote === -1) {
      question.downvoters.push(userId);
      if (author) author.reputation -= 2;
    }

    await question.save();
    if (author) {
      await author.save();
      await awardBadges(author._id);
    }

    const populated = await Question.findById(id).populate("author", "name");
    res.json(populated);
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
