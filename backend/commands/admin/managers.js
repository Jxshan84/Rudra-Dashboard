const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("managers")
    .setDescription("View all Premium Currency Managers"),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ Only bot owner can use this command.",
        ephemeral: true
      });
    }

    const managers = await User.find({ isCurrencyManager: true });

    if (!managers.length) {
      return interaction.reply({
        content: "⚠️ No Currency Managers found.",
        ephemeral: true
      });
    }

    const list = managers
      .map((u, i) => `${i + 1}. <@${u.userId}>`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("🛡️ Premium Currency Managers")
      .setDescription(list)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};