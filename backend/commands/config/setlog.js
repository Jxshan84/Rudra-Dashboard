const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const GuildSettings = require("../../models/GuildSettings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setlog")
    .setDescription("Set the moderation log channel")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("Log channel")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  async execute(interaction) {

    const channel =
      interaction.options.getChannel("channel");

    let settings =
      await GuildSettings.findOne({
        guildId: interaction.guild.id
      });

    if (!settings) {
      settings = await GuildSettings.create({
        guildId: interaction.guild.id
      });
    }

    settings.modLogChannel = channel.id;

    await settings.save();

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ Moderation Logs Configured")
      .setDescription(
        `Moderation logs will now be sent to ${channel}.`
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });

  }
};