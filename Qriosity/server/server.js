// server.js
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const questionRoutes = require("./routes/questions");
const answerRoutes = require("./routes/answers");
const commentRoutes = require("./routes/comments");
const profileRoutes = require("./routes/profile");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Serve static files from the "uploads" directory
app.use("/uploads", express.static("uploads"));

// routing
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", require("./routes/notifications"));


app.get("/", (req, res) => res.send("Qriosity API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));