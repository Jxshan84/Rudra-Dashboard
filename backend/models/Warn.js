const mongoose = require("mongoose");

const warnSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  moderatorId: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    default: "No reason provided"
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Warn || mongoose.model("Warn", warnSchema);