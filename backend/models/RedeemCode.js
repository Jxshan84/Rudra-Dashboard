const mongoose = require("mongoose");

const redeemCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },

  rewardType: {
    type: String,
    required: true,
    enum: ["coins", "gems", "premiumgems", "xp", "item", "role"]
  },

  amount: {
    type: Number,
    default: 0
  },

  itemName: {
    type: String,
    default: null
  },

  roleId: {
    type: String,
    default: null
  },

  uses: {
    type: Number,
    default: 1
  },

  used: {
    type: Number,
    default: 0
  },

  maxRedeemPerUser: {
    type: Number,
    default: 1
  },

  redeemedBy: {
    type: Array,
    default: []
  },

  expiresAt: {
    type: Date,
    default: null
  },

  createdBy: {
    type: String,
    required: true
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.models.RedeemCode ||
  mongoose.model("RedeemCode", redeemCodeSchema);