const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Answer = require("../models/Answer");
const authMiddleware = require("../middleware/auth");

// Vote an answer
router.patch("/vote/:id", authMiddleware, async (req, res) => {
  const { vote } = req.body; // 1 or -1
  if (![1, -1].includes(vote))
    return res.status(400).json({ msg: "Vote must be 1 or -1" });

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ msg: "Invalid answer ID" });

  try {
    const answer = await Answer.findById(id);
    if (!answer) return res.status(404).json({ msg: "Answer not found" });

    answer.votes += vote;
    await answer.save();
    res.json(answer);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
