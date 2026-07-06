const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const User = require("../../models/User");
const ShopItem = require("../../models/ShopItem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy an item from the shop")
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Item name")
        .setRequired(true)
    ),

  async execute(interaction) {

    const itemName = interaction.options.getString("item");

    const item = await ShopItem.findOne({
      guildId: interaction.guild.id,
      name: itemName
    });

    if (!item) {
      return interaction.reply({
        content: "❌ Item not found.",
        ephemeral: true
      });
    }

    let user = await User.findOne({
      userId: interaction.user.id
    });

    if (!user) {
      user = await User.create({
        userId: interaction.user.id
      });
    }

    let balance = 0;

    switch (item.currency) {
      case "coins":
        balance = user.coins;
        break;

      case "gems":
        balance = user.gems;
        break;

      case "premiumGems":
        balance = user.premiumGems;
        break;
    }

    if (balance < item.price) {
      return interaction.reply({
        content: `❌ You need ${item.price} ${item.currency}.`,
        ephemeral: true
      });
    }

    switch (item.currency) {
      case "coins":
        user.coins -= item.price;
        break;

      case "gems":
        user.gems -= item.price;
        break;

      case "premiumGems":
        user.premiumGems -= item.price;
        break;
    }

    user.inventory.push(item.name);

    if (item.roleId) {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(item.roleId);
    }

    await user.save();

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🛍️ Purchase Successful")
      .addFields(
        {
          name: "Item",
          value: item.name,
          inline: true
        },
        {
          name: "Price",
          value: `${item.price} ${item.currency}`,
          inline: true
        }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });

  }
};