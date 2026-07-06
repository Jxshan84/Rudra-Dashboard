const mongoose = require("mongoose");

const redeemCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },

  reward: {
    type: Number,
    required: true
  },

  uses: {
    type: Number,
    default: 1
  },

  used: {
    type: Number,
    default: 0
  },

  expiresAt: {
    type: Date,
    required: true
  },

  createdBy: {
    type: String,
    required: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.models.RedeemCode || mongoose.model("RedeemCode", redeemCodeSchema);