const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gems")
    .setDescription("View your Premium Gems"),

  async execute(interaction) {
    await interaction.reply({
      content: "💎 Gems command coming soon.",
      ephemeral: true
    });
  }
};