// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

module.exports = async function (req, res, next) {
  // Expect header: Authorization: Bearer <token>
  const authHeader = req.header("Authorization") || req.header("authorization");
  if (!authHeader) return res.status(401).json({ msg: "No token, authorization denied" });

  const parts = authHeader.split(" ");
  const token = parts.length === 2 ? parts[1] : authHeader;

  if (!token) return res.status(401).json({ msg: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // attach user id to request
    req.user = { id: decoded.user.id };
    // optionally fetch user from DB for extra checks:
    // req.userDoc = await User.findById(decoded.user.id).select("-password");
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};
