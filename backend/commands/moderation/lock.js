const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock the current channel.")
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for locking")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {

    const reason =
      interaction.options.getString("reason") || "No reason provided.";

    const channel = interaction.channel;

    await channel.permissionOverwrites.edit(
      interaction.guild.roles.everyone,
      {
        SendMessages: false
      }
    );

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("🔒 Channel Locked")
      .setDescription(`${channel} has been locked.`)
      .addFields(
        {
          name: "Moderator",
          value: interaction.user.tag,
          inline: true
        },
        {
          name: "Reason",
          value: reason,
          inline: true
        }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });

  }
};