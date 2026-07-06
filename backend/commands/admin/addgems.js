module.exports = {
  data: {
    name: "addgems",
    toJSON() {
      return {
        name: "addgems",
        description: "Coming soon"
      };
    }
  },
  async execute(interaction) {
    await interaction.reply({
      content: "💎 Add Gems command coming soon.",
      ephemeral: true
    });
  }
};