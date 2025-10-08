// routes/notifications.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");

// GET /api/notifications
// Returns all notifications for logged-in user sorted by newest first
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate("sender", "name avatar")
      .populate("question", "title")
      .sort({ createdAt: -1 })
      .limit(100); // safety limit

    res.json(notifications);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, read: false });
    res.json({ unread: count });
  } catch (err) {
    console.error("Unread count error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ msg: "Notification not found" });
    if (notif.user.toString() !== req.user.id) return res.status(403).json({ msg: "Not authorized" });

    if (!notif.read) {
      notif.read = true;
      await notif.save();
    }

    // Mongoose 6+ fix: populate returns a promise automatically
    await notif.populate("sender", "name avatar");

    res.json(notif);
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// PATCH /api/notifications/mark-all-read
router.patch("/mark-all-read", auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
    res.json({ msg: "All marked read" });
  } catch (err) {
    console.error("Mark all read error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
