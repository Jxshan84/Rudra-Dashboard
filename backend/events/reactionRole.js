const ReactionRole = require("../models/ReactionRole");
const { PermissionsBitField } = require("discord.js");

async function warnChannel(message, text) {
  try {
    await message.channel.send({
      content: text
    });
  } catch {}
}

module.exports = (client) => {

  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();

      const guild = reaction.message.guild;
      if (!guild) return;

      const emoji = reaction.emoji.toString();

      const data = await ReactionRole.findOne({
        guildId: guild.id,
        messageId: reaction.message.id,
        "roles.emoji": emoji
      });

      if (!data) return;

      const roleData = data.roles.find(r => r.emoji === emoji);
      if (!roleData) return;

      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.get(roleData.roleId);
      const botMember = guild.members.me;

      if (!role) {
        return warnChannel(
          reaction.message,
          "❌ Reaction Role Error: Role not found. Please update this reaction role from dashboard."
        );
      }

      if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return warnChannel(
          reaction.message,
          "❌ I need **Manage Roles** permission to give reaction roles."
        );
      }

      if (role.position >= botMember.roles.highest.position) {
        return warnChannel(
          reaction.message,
          `❌ I cannot give ${role}. Move my **RUDRA bot role** above this role in Server Settings > Roles.`
        );
      }

      if (data.type === "unique") {
        for (const r of data.roles) {
          if (r.roleId !== roleData.roleId) {
            await member.roles.remove(r.roleId).catch(() => {});
          }
        }
      }

      if (data.type === "reversed") {
        await member.roles.remove(role.id).catch(() => {});
      } else {
        await member.roles.add(role.id);
      }

    } catch (err) {
      console.error("Reaction Add Error:", err);
      await warnChannel(
        reaction.message,
        "❌ Reaction Role Error: I could not give the role. Check my permissions and role position."
      );
    }
  });

  client.on("messageReactionRemove", async (reaction, user) => {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();

      const guild = reaction.message.guild;
      if (!guild) return;

      const emoji = reaction.emoji.toString();

      const data = await ReactionRole.findOne({
        guildId: guild.id,
        messageId: reaction.message.id,
        "roles.emoji": emoji
      });

      if (!data) return;

      const roleData = data.roles.find(r => r.emoji === emoji);
      if (!roleData) return;

      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.get(roleData.roleId);
      const botMember = guild.members.me;

      if (!role) return;

      if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return warnChannel(
          reaction.message,
          "❌ I need **Manage Roles** permission to remove reaction roles."
        );
      }

      if (role.position >= botMember.roles.highest.position) {
        return warnChannel(
          reaction.message,
          `❌ I cannot manage ${role}. Move my **RUDRA bot role** above this role.`
        );
      }

      if (data.type === "verify") return;

      if (data.type === "reversed") {
        await member.roles.add(role.id);
      } else {
        await member.roles.remove(role.id);
      }

    } catch (err) {
      console.error("Reaction Remove Error:", err);
    }
  });

};