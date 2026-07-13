const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout from a member")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to unmute")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const target =
      interaction.options.getUser("user");

    const reason =
      interaction.options.getString("reason") ||
      "No reason provided";

    const member =
      await interaction.guild.members
        .fetch(target.id)
        .catch(() => null);

    if (!member) {
      return interaction.editReply({
        content: "❌ User not found."
      });
    }

    if (!member.moderatable) {
      return interaction.editReply({
        content:
          "❌ I cannot unmute this member."
      });
    }

    if (!member.communicationDisabledUntil) {
      return interaction.editReply({
        content:
          "❌ This member is not muted."
      });
    }

    await member.timeout(
      null,
      reason
    );

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🔊 Member Unmuted")
      .addFields(
        {
          name: "User",
          value: target.tag,
          inline: true
        },
        {
          name: "Moderator",
          value: interaction.user.tag,
          inline: true
        },
        {
          name: "Reason",
          value: reason
        }
      )
      .setTimestamp();

    return interaction.editReply({
      embeds: [embed]
    });
  }
};