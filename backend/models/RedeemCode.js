const mongoose = require("mongoose");

const redeemCodeSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },

  code: {
    type: String,
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

redeemCodeSchema.index({ guildId: 1, code: 1 }, { unique: true });

module.exports =
  mongoose.models.RedeemCode ||
  mongoose.model("RedeemCode", redeemCodeSchema);