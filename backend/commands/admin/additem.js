const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const ShopItem = require("../../models/ShopItem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("additem")
    .setDescription("Add an item to the shop")

    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("Item name")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("description")
        .setDescription("Item description")
        .setRequired(true)
    )

    .addIntegerOption(option =>
      option
        .setName("price")
        .setDescription("Item price")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("currency")
        .setDescription("Currency")
        .setRequired(true)
        .addChoices(
          { name: "Coins", value: "coins" },
          { name: "Gems", value: "gems" },
          { name: "Premium Gems", value: "premiumGems" }
        )
    )

    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("Role reward (optional)")
        .setRequired(false)
    ),

  async execute(interaction) {

    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ Only the bot owner can use this command.",
        ephemeral: true
      });
    }

    const item = await ShopItem.create({
      guildId: interaction.guild.id,
      name: interaction.options.getString("name"),
      description: interaction.options.getString("description"),
      price: interaction.options.getInteger("price"),
      currency: interaction.options.getString("currency"),
      roleId: interaction.options.getRole("role")?.id || null
    });

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🛒 Shop Item Added")
      .addFields(
        { name: "Name", value: item.name, inline: true },
        { name: "Price", value: `${item.price}`, inline: true },
        { name: "Currency", value: item.currency, inline: true },
        { name: "Description", value: item.description }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });

  }
};