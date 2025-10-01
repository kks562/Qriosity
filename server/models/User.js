// models/User.js
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  reputation: { type: Number, default: 1 },
  bio: { type: String, default: '' },
  profileImage: { type: String, default: 'https://placehold.co/150x150/E5E7EB/4B5563?text=User' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
