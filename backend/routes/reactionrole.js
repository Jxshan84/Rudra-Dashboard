const express = require("express");
const { EmbedBuilder } = require("discord.js");
const ReactionRole = require("../models/ReactionRole");

module.exports = (client) => {

    const router = express.Router();

    // Dashboard Create Reaction Role
    router.post("/create", async (req, res) => {

        try {

            const {
                guildId,
                channelId,
                roleId,
                emoji,
                title,
                description,
                createdBy
            } = req.body;

            const guild = client.guilds.cache.get(guildId);

            if (!guild)
                return res.json({
                    success: false,
                    message: "Guild not found."
                });

            const channel = guild.channels.cache.get(channelId);

            if (!channel)
                return res.json({
                    success: false,
                    message: "Channel not found."
                });

            const embed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle(title || "Reaction Roles")
                .setDescription(
                    description || "React below to receive your role."
                );

            const message = await channel.send({
                embeds: [embed]
            });

            await message.react(emoji);

            await ReactionRole.create({
                guildId,
                channelId,
                messageId: message.id,
                roleId,
                emoji,
                title,
                description,
                createdBy
            });

            res.json({
                success: true,
                messageId: message.id
            });

        } catch (err) {

            console.error(err);

            res.json({
                success: false,
                message: err.message
            });

        }

    });

    // Existing Message Reaction Role
    router.post("/existing", async (req, res) => {

        try {

            const {
                guildId,
                channelId,
                messageId,
                roleId,
                emoji,
                createdBy
            } = req.body;

            const guild = client.guilds.cache.get(guildId);

            if (!guild)
                return res.json({
                    success: false,
                    message: "Guild not found."
                });

            const channel = guild.channels.cache.get(channelId);

            if (!channel)
                return res.json({
                    success: false,
                    message: "Channel not found."
                });

            const message = await channel.messages.fetch(messageId);

            await message.react(emoji);

            await ReactionRole.create({
                guildId,
                channelId,
                messageId,
                roleId,
                emoji,
                createdBy
            });

            res.json({
                success: true
            });

        } catch (err) {

            console.error(err);

            res.json({
                success: false,
                message: err.message
            });

        }

    });

    // List Reaction Roles
    router.get("/:guildId", async (req, res) => {

        const data = await ReactionRole.find({
            guildId: req.params.guildId
        });

        res.json(data);

    });

    // Delete Reaction Role
    router.delete("/:id", async (req, res) => {

        await ReactionRole.findByIdAndDelete(req.params.id);

        res.json({
            success: true
        });

    });

    return router;

};