const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const questionRoutes = require("./routes/questions");
const answerRoutes = require("./routes/answers");
const commentRoutes = require("./routes/comments");

const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/comments", commentRoutes);

// Root
app.get("/", (req, res) => res.send("Qriosity API Running"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
