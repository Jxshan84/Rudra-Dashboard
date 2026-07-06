const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removemanager")
    .setDescription("Remove premium currency manager permission")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to remove from currency managers")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ Only bot owner can use this command.",
        ephemeral: true
      });
    }

    const target = interaction.options.getUser("user");

    let user = await User.findOne({ userId: target.id });

    if (!user || !user.isCurrencyManager) {
      return interaction.reply({
        content: "⚠️ This user is not a Currency Manager.",
        ephemeral: true
      });
    }

    user.isCurrencyManager = false;
    await user.save();

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("✅ Manager Removed")
      .setDescription(`💎 ${target} is no longer a Premium Currency Manager.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};