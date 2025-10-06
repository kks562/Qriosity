// routes/profile.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Question = require("../models/Questions");
const multer = require("multer");
const path = require("path");

// Set up storage for multer
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("avatar");

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// @route   GET api/profile/:userId
// @desc    Get user profile
// @access  Public
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const questionsCount = await Question.countDocuments({
      author: req.params.userId,
    });
    const answers = await Question.find({ "answers.author": user._id });
    const answersCount = answers.reduce(
      (acc, q) =>
        acc + q.answers.filter((a) => a.author.equals(user._id)).length,
      0
    );

    res.json({
      user,
      questionsCount,
      answersCount,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/profile/avatar
// @desc    Upload profile picture
// @access  Private
router.post("/avatar", auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400).json({ msg: err });
    } else {
      if (req.file == undefined) {
        res.status(400).json({ msg: "Error: No File Selected!" });
      } else {
        try {
          const user = await User.findById(req.user.id);
          user.avatar = req.file.path;
          await user.save();
          res.json({
            msg: "File uploaded!",
            filePath: req.file.path,
          });
        } catch (err) {
          console.error(err.message);
          res.status(500).send("Server Error");
        }
      }
    }
  });
});

module.exports = router;