const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },

  coins: {
    type: Number,
    default: 0
  },

  bank: {
    type: Number,
    default: 0
  },

  gems: {
    type: Number,
    default: 0
  },

  premiumGems: {
    type: Number,
    default: 0
  },

  isCurrencyManager: {
    type: Boolean,
    default: false
  },

  xp: {
    type: Number,
    default: 0
  },

  level: {
    type: Number,
    default: 1
  },

  inventory: {
    type: Array,
    default: []
  },

  lastDaily: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
