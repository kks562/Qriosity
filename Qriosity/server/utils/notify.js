const Notification = require("../models/Notification");

const createNotification = async ({ user, sender, type, message, question, answer, comment }) => {
  try {
    // don't notify self
    if (user.toString() === sender.toString()) return;

    await Notification.create({
      user,       // recipient of notification
      sender,     // who triggered it
      type,       // 'answer', 'comment', etc.
      message,
      question,
      answer,
      comment,
    });
  } catch (err) {
    console.error("Notification error:", err);
  }
};

module.exports = { createNotification };
