const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // Read token from Authorization header: "Bearer <token>"
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // contains user.id
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
}

module.exports = authMiddleware;
