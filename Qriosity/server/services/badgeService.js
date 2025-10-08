// services/badgeService.js
const User = require("../models/User");

const awardBadges = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      const reputation = user.reputation;
      const badges = user.badges || [];

      if (reputation >= 1000 && !badges.includes("Gold")) {
        user.badges.push("Gold");
      }
      if (reputation >= 500 && !badges.includes("Silver")) {
        user.badges.push("Silver");
      }
      if (reputation >= 100 && !badges.includes("Bronze")) {
        user.badges.push("Bronze");
      }

      await user.save();
    }
  } catch (error) {
    console.error("Error awarding badges:", error);
  }
};

module.exports = { awardBadges };