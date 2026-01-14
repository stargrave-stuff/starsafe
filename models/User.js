const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // The user's unique Discord ID (e.g., "123456789012345678")
  discordId: {
    type: String,
    required: true,
    unique: true,
  },

  // A simple true/false to check if they are currently premium
  isPremium: {
    type: Boolean,
    default: false,
  },

  // The exact date and time their premium access ends
  premiumUntil: {
    type: Date,
    default: null,
  },

  // Useful for tracking when they first interacted with the bot
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
