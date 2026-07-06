const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const User = require("../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("grantmanager")
    .setDescription("Give Currency Manager permission")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Select a user")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    // Sirf Bot Owner
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ Only the Bot Owner can use this command.",
        ephemeral: true
      });
    }

    const target = interaction.options.getUser("user");

    let user = await User.findOne({
      userId: target.id
    });

    if (!user) {
      user = await User.create({
        userId: target.id
      });
    }

    if (user.isCurrencyManager) {
      return interaction.reply({
        content: "⚠️ This user is already a Currency Manager.",
        ephemeral: true
      });
    }

    user.isCurrencyManager = true;
    await user.save();

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ Currency Manager Granted")
      .setDescription(
        `👤 **${target.tag}** is now a **Currency Manager**.\n\nThey can now use:\n• /addgems\n• /removegems`
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });

  }
};