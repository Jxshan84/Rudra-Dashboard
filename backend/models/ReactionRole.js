const mongoose = require("mongoose");

const reactionRoleSchema = new mongoose.Schema({

    guildId: {
        type: String,
        required: true
    },

    channelId: {
        type: String,
        required: true
    },

    messageId: {
        type: String,
        required: true
    },

    roleId: {
        type: String,
        required: true
    },

    emoji: {
        type: String,
        required: true
    },

    title: {
        type: String,
        default: "Reaction Roles"
    },

    description: {
        type: String,
        default: "React below to receive your role."
    },

    createdBy: {
        type: String,
        default: null
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("ReactionRole", reactionRoleSchema);