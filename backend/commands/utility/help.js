const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show RUDRA help menu."),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("🛡️ RUDRA Help Menu")
      .setDescription("All main RUDRA command categories.")
      .addFields(
        {
          name: "🛡 Moderation",
          value: "`/ban` `/kick` `/timeout` `/warn` `/purge` `/lock` `/unlock` `/mute` `/unmute`"
        },
        {
          name: "😀 Reaction Roles",
          value: "Use dashboard to create reaction roles.\n`/reactionrole` command coming after dashboard setup."
        },
        {
          name: "💰 Economy",
          value: "`/balance` `/daily` `/work` `/shop` `/buy` `/redeem`"
        },
        {
          name: "⚙️ Server Settings",
          value: "Prefix, welcome, logs, autorole and automod are managed from dashboard."
        },
        {
          name: "👑 Premium",
          value: "Premium features can be managed from RUDRA Dashboard."
        }
      )
      .setFooter({ text: "RUDRA • Powerful Discord Bot" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};