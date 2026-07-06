const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const ShopItem = require("../../models/ShopItem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View server shop items"),

  async execute(interaction) {
    const items = await ShopItem.find({
      guildId: interaction.guild.id
    });

    if (!items.length) {
      return interaction.reply({
        content: "🛒 Shop is empty.",
        ephemeral: true
      });
    }

    const list = items
      .map((item, index) => {
        const currencyIcon =
          item.currency === "coins" ? "🪙" :
          item.currency === "gems" ? "💎" :
          "👑";

        return `**${index + 1}. ${item.name}**\n${item.description}\nPrice: **${item.price} ${currencyIcon} ${item.currency}**`;
      })
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("🛒 Server Shop")
      .setDescription(list)
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};