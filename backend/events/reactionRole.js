const ReactionRole = require("../models/ReactionRole");

module.exports = (client) => {

client.on("messageReactionAdd", async (reaction, user) => {

    if (user.bot) return;

    try {

        if (reaction.partial) await reaction.fetch();

        const data = await ReactionRole.findOne({
            guildId: reaction.message.guild.id,
            messageId: reaction.message.id,
            emoji: reaction.emoji.toString()
        });

        if (!data) return;

        const member = await reaction.message.guild.members.fetch(user.id);

        await member.roles.add(data.roleId);

    } catch (err) {
        console.error("Reaction Add Error:", err);
    }

});

client.on("messageReactionRemove", async (reaction, user) => {

    if (user.bot) return;

    try {

        if (reaction.partial) await reaction.fetch();

        const data = await ReactionRole.findOne({
            guildId: reaction.message.guild.id,
            messageId: reaction.message.id,
            emoji: reaction.emoji.toString()
        });

        if (!data) return;

        const member = await reaction.message.guild.members.fetch(user.id);

        await member.roles.remove(data.roleId);

    } catch (err) {
        console.error("Reaction Remove Error:", err);
    }

});

};