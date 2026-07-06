const GuildSettings = require("../../models/GuildSettings");
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to ban")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for ban")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {

    const target = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: "❌ User not found.",
        ephemeral: true
      });
    }

    if (!member.bannable) {
      return interaction.reply({
        content: "❌ I cannot ban this member.",
        ephemeral: true
      });
    }

    await member.ban({ reason });

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("🔨 Member Banned")
      .addFields(
        {
          name: "User",
          value: `${target.tag}`,
          inline: true
        },
        {
          name: "Moderator",
          value: `${interaction.user.tag}`,
          inline: true
        },
        {
          name: "Reason",
          value: reason
        }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
   const settings = await GuildSettings.findOne({
  guildId: interaction.guild.id
});

if (settings && settings.modLogChannel) {
  const logChannel = interaction.guild.channels.cache.get(settings.modLogChannel);

  if (logChannel) {
    await logChannel.send({ embeds: [embed] });
  }
}
    });
  }
};