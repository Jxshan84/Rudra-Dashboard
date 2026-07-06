const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("grantmanager")
    .setDescription("Give premium currency manager permission")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to make currency manager")
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

    if (!user) {
      user = await User.create({ userId: target.id });
    }

    user.isCurrencyManager = true;
    await user.save();

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ Manager Added")
      .setDescription(`💎 ${target} is now a Premium Currency Manager.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};