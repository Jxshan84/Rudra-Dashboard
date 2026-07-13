const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock a channel")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("Channel to unlock")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageChannels
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const channel =
      interaction.options.getChannel(
        "channel"
      ) || interaction.channel;

    const reason =
      interaction.options.getString(
        "reason"
      ) || "No reason provided";

    await channel.permissionOverwrites.edit(
      interaction.guild.roles.everyone,
      {
        SendMessages: null
      }
    );

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🔓 Channel Unlocked")
      .addFields(
        {
          name: "Channel",
          value: `<#${channel.id}>`,
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

    await interaction.editReply({
      embeds: [embed]
    });

  }
};