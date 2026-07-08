const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setupmute")
    .setDescription("Create and setup muted role permissions.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    let muteRole = interaction.guild.roles.cache.find(
      r => r.name.toLowerCase() === "muted"
    );

    if (!muteRole) {
      muteRole = await interaction.guild.roles.create({
        name: "Muted",
        color: "#2f3136",
        reason: `Mute role setup by ${interaction.user.tag}`
      });
    }

    let updated = 0;

    for (const channel of interaction.guild.channels.cache.values()) {
      try {
        await channel.permissionOverwrites.edit(muteRole, {
          SendMessages: false,
          AddReactions: false,
          Speak: false,
          SendMessagesInThreads: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false
        });

        updated++;
      } catch {}
    }

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ Mute Role Setup Complete")
      .addFields(
        { name: "Role", value: `${muteRole}`, inline: true },
        { name: "Channels Updated", value: `${updated}`, inline: true }
      )
      .setFooter({ text: "RUDRA Moderation" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};