const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const ShopItem = require("../../models/ShopItem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("additem")
    .setDescription("Add global item to Rudra shop")
    .addStringOption(option =>
      option.setName("name").setDescription("Item name").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("description").setDescription("Item description").setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("price").setDescription("Item price").setRequired(true)
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
      option.setName("role").setDescription("Role reward optional").setRequired(false)
    ),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ Only the bot owner can manage the global shop.",
        ephemeral: true
      });
    }

    const name = interaction.options.getString("name");
    const description = interaction.options.getString("description");
    const price = interaction.options.getInteger("price");
    const currency = interaction.options.getString("currency");
    const role = interaction.options.getRole("role");

    if (price <= 0) {
      return interaction.reply({
        content: "❌ Price must be greater than 0.",
        ephemeral: true
      });
    }

    const exists = await ShopItem.findOne({ name });

    if (exists) {
      return interaction.reply({
        content: "❌ This item already exists in the global shop.",
        ephemeral: true
      });
    }

    const item = await ShopItem.create({
      name,
      description,
      price,
      currency,
      roleId: role ? role.id : null,
      category: "General",
      stock: -1,
      enabled: true,
      image: null
    });

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🛒 Global Shop Item Added")
      .addFields(
        { name: "Name", value: item.name, inline: true },
        { name: "Price", value: `${item.price}`, inline: true },
        { name: "Currency", value: item.currency, inline: true },
        { name: "Role Reward", value: role ? `${role}` : "None", inline: true },
        { name: "Description", value: item.description }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};