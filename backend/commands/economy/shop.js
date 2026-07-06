const mongoose = require("mongoose");

const shopItemSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    unique: true
  },

  description: {
    type: String,
    default: "No description"
  },

  price: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    enum: ["coins", "gems", "premiumGems"],
    default: "coins"
  },

  roleId: {
    type: String,
    default: null
  },

  image: {
    type: String,
    default: null
  },

  stock: {
    type: Number,
    default: -1
  },

  category: {
    type: String,
    default: "General"
  },

  enabled: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.models.ShopItem ||
  mongoose.model("ShopItem", shopItemSchema);