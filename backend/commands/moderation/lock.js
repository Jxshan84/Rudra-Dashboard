const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a channel")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("Channel to lock")
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
        SendMessages: false
      }
    );

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("🔒 Channel Locked")
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