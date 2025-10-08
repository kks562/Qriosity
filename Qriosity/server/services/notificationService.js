// services/notificationService.js
const Notification = require("../models/Notification");
const Question = require("../models/Questions");

const createNotification = async ({ user, sender, type, message, question, answer, comment }) => {
  try {
    if (!user || !sender) {
      throw new Error("Recipient and sender required for notification");
    }

    // do not notify yourself
    if (user.toString() === sender.toString()) return;

    let answerBody = null;
    if (answer && question) {
      const q = await Question.findById(question).select("answers");
      const a = q?.answers?.id(answer);
      if (a) answerBody = a.body;
    }

    await Notification.create({
      user,
      sender,
      type,
      message,
      question,
      answer,
      comment,
      answerBody,
    });
  } catch (err) {
    // log, but don't throw - notifications shouldn't break main flow
    console.error("createNotification error:", err);
  }
};

module.exports = { createNotification };
