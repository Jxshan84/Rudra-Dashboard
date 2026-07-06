const mongoose = require("mongoose");

const guildSettingsSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },

  prefix: {
    type: String,
    default: "/"
  },

  isPremium: {
    type: Boolean,
    default: false
  },

  modLogChannel: {
    type: String,
    default: null
  },

  welcomeChannel: {
    type: String,
    default: null
  },

  leaveChannel: {
    type: String,
    default: null
  },

  autoRole: {
    type: String,
    default: null
  },

  verificationRole: {
    type: String,
    default: null
  },

  gemsLogChannel: {
    type: String,
    default: null
  },

  ticketCategory: {
    type: String,
    default: null
  },

  automod: {
    type: Boolean,
    default: false
  },

  antiSpam: {
    type: Boolean,
    default: false
  },

  antiLink: {
    type: Boolean,
    default: false
  },

  antiInvite: {
    type: Boolean,
    default: false
  },

  antiRaid: {
    type: Boolean,
    default: false
  },

  autoRespondEnabled: {
    type: Boolean,
    default: true
  },

  autoReactEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports =
  mongoose.models.GuildSettings ||
  mongoose.model("GuildSettings", guildSettingsSchema);