const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const Warn = require("../../models/Warn");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View a member's warnings")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const target =
      interaction.options.getUser("user");

    const warns = await Warn.find({
      guildId: interaction.guild.id,
      userId: target.id
    });

    if (!warns.length) {
      return interaction.editReply({
        content:
          "✅ This user has no warnings."
      });
    }

    const description = warns
      .map(
        (warn, index) =>
          `**${index + 1}.** ${warn.reason}\n👮 <@${warn.moderatorId}>`
      )
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setColor("Orange")
      .setTitle(
        `⚠️ Warnings • ${target.tag}`
      )
      .setDescription(description)
      .setFooter({
        text: `Total Warnings: ${warns.length}`
      })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed]
    });
  }
};