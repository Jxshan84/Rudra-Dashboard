const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const Warn = require("../../models/Warn");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")

    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to warn")
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

    const member =
      interaction.options.getUser(
        "user"
      );

    const reason =
      interaction.options.getString(
        "reason"
      ) || "No reason provided";

    if (member.bot) {
      return interaction.reply({
        content:
          "❌ You cannot warn bots.",
        ephemeral: true
      });
    }

    if (
      member.id === interaction.user.id
    ) {
      return interaction.reply({
        content:
          "❌ You cannot warn yourself.",
        ephemeral: true
      });
    }

    const warn = await Warn.create({
      guildId:
        interaction.guild.id,

      userId:
        member.id,

      moderatorId:
        interaction.user.id,

      reason
    });

    const count =
      await Warn.countDocuments({
        guildId:
          interaction.guild.id,

        userId:
          member.id
      });

    const embed =
      new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(
          "⚠️ User Warned"
        )
        .addFields(
          {
            name: "User",
            value: `<@${member.id}>`,
            inline: true
          },
          {
            name: "Moderator",
            value: `<@${interaction.user.id}>`,
            inline: true
          },
          {
            name: "Total Warnings",
            value: String(count),
            inline: true
          },
          {
            name: "Reason",
            value: reason
          }
        )
        .setFooter({
          text: `Warn ID: ${warn._id}`
        })
        .setTimestamp();

    return interaction.reply({
      embeds: [embed]
    });
  }
};