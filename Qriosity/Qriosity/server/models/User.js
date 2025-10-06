// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    avatar: { type: String, default: "uploads/default-avatar.png" }, // Default avatar
    reputation: { type: Number, default: 0 },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);