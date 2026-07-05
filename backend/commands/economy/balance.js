Balance.js 

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your coins, bank and gems"),

  async execute(interaction) {
    const userId = interaction.user.id;

    let user = await User.findOne({ userId });

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
      .setTitle(`${interaction.user.username}'s Balance 💰`)
      .setColor("Gold")
      .addFields(
        { name: "🪙 Coins", value: `${user.coins}`, inline: true },
        { name: "🏦 Bank", value: `${user.bank}`, inline: true },
        { name: "💎 Gems", value: `${user.gems}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};