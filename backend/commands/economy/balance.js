const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const User = require("../../models/User");

module.exports = {

  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription(
      "Check your coins, bank and gems"
    )

    .addUserOption(option =>
      option
        .setName("user")
        .setDescription(
          "Check another user's balance"
        )
        .setRequired(false)
    ),

  async execute(interaction) {

    const targetUser =
      interaction.options.getUser("user") ||
      interaction.user;

    const userId = targetUser.id;

    let user = await User.findOne({
      userId
    });

    if (!user) {

      user = await User.create({
        userId,
        coins: 0,
        bank: 0,
        gems: 0,
        xp: 0
      });

    }

    const embed = new EmbedBuilder()
      .setTitle(
        `${targetUser.username}'s Balance 💰`
      )
      .setColor("Gold")
      .addFields(
        {
          name: "🪙 Coins",
          value: `${user.coins}`,
          inline: true
        },
        {
          name: "🏦 Bank",
          value: `${user.bank}`,
          inline: true
        },
        {
          name: "💎 Gems",
          value: `${user.gems}`,
          inline: true
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.username}`
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });

  }

};