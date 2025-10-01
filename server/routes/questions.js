const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Question = require('../models/Questions');
const authMiddleware = require('../middleware/auth');

// ==============================
// Get all questions
// ==============================
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name')
      .populate({ path: 'answers.author', select: 'name' });

    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ==============================
// Get a single question + increment views
// ==============================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ msg: 'Invalid Question ID' });

    const question = await Question.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name')
      .populate({ path: 'answers.author', select: 'name' });

    if (!question) return res.status(404).json({ msg: 'Question not found' });

    res.json(question);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ==============================
// Create a new question
// ==============================
router.post('/', authMiddleware, async (req, res) => {
  const { title, body, tags } = req.body;
  try {
    const newQuestion = new Question({
      title,
      body,
      author: req.user.id,
      tags: Array.isArray(tags) ? tags : (tags || '').split(',').map(tag => tag.trim()),
    });

    const question = await newQuestion.save();
    const populated = await Question.findById(question._id).populate('author', 'name');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ==============================
// Add an answer to a question
// ==============================
router.post('/:id/answer', authMiddleware, async (req, res) => {
  const { body } = req.body;
  const { id } = req.params;

  if (!body) return res.status(400).json({ msg: 'Answer body is required' });
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: 'Invalid Question ID' });

  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ msg: 'Question not found' });

    const newAnswer = { body, author: req.user.id };
    question.answers.push(newAnswer);
    await question.save();

    // Return the last answer with its _id (for comments)
    const savedAnswer = question.answers[question.answers.length - 1];
    res.status(201).json({ ...savedAnswer.toObject(), questionId: id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
