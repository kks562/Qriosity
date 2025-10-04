const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Question = require("../models/Questions");
const auth = require("../middleware/auth");

// Vote an answer
router.patch("/:questionId/answer/:answerId/vote", auth, async (req, res) => {
  const { questionId, answerId } = req.params;
  const { vote } = req.body; // 1 or -1

  if (![1, -1, 0].includes(vote)) return res.status(400).json({ msg: "Vote must be 1, -1, or 0" });
  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId))
    return res.status(400).json({ msg: "Invalid IDs" });

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ msg: "Question not found" });

    const answer = question.answers.id(answerId);
    if (!answer) return res.status(404).json({ msg: "Answer not found" });

    if (!answer.userVotes) answer.userVotes = [];

    const existingVote = answer.userVotes.find(v => v.user.toString() === req.user.id);
    if (existingVote) {
      if (vote === 0) {
        answer.userVotes = answer.userVotes.filter(v => v.user.toString() !== req.user.id);
      } else {
        existingVote.vote = vote;
      }
    } else if (vote !== 0) {
      answer.userVotes.push({ user: req.user.id, vote });
    }

    await question.save();
    res.json({ totalVotes: answer.userVotes.reduce((a,b) => a + b.vote, 0), userVotes: answer.userVotes });
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
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(50, parseInt(req.query.limit || "20"));
    const skip = (page - 1) * limit;

    const questions = await Question.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name")
      .populate({ path: "answers.author", select: "name" });

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

    if (tags) {
      const tagArr = tags.split(",").map(t => t.trim());
      query.tags = { $in: tagArr };
    }

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

    // Remove previous vote
    if (question.upvoters.includes(userId)) question.upvoters.pull(userId);
    if (question.downvoters.includes(userId)) question.downvoters.pull(userId);

    // Apply new vote if vote is 1 or -1
    if (vote === 1) question.upvoters.push(userId);
    else if (vote === -1) question.downvoters.push(userId);

    await question.save();
    const populated = await Question.findById(id).populate("author", "name");
    res.json(populated);
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
