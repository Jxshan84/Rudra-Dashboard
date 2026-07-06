const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const AutoRule = require("../../models/AutoRule");
const GuildSettings = require("../../models/GuildSettings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("autorespond")
    .setDescription("Manage auto responses")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName("add")
        .setDescription("Add an auto response")
        .addStringOption(opt =>
          opt.setName("trigger").setDescription("Trigger text").setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName("response").setDescription("Bot response").setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("remove")
        .setDescription("Remove an auto response")
        .addStringOption(opt =>
          opt.setName("trigger").setDescription("Trigger text").setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("list")
        .setDescription("List auto responses")
    )
    .addSubcommand(sub =>
      sub
        .setName("toggle")
        .setDescription("Enable or disable auto responses")
        .addBooleanOption(opt =>
          opt.setName("enabled").setDescription("True = on, False = off").setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    let settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
    if (!settings) {
      settings = await GuildSettings.create({ guildId: interaction.guild.id });
    }

    if (sub === "toggle") {
      const enabled = interaction.options.getBoolean("enabled");
      settings.autoRespondEnabled = enabled;
      await settings.save();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(enabled ? "Green" : "Red")
            .setTitle("🤖 Auto Respond")
            .setDescription(`Auto Respond is now **${enabled ? "Enabled" : "Disabled"}**.`)
        ]
      });
    }

    if (sub === "add") {
      const trigger = interaction.options.getString("trigger").toLowerCase();
      const response = interaction.options.getString("response");

      const limit = settings.isPremium ? 100 : 5;

      const count = await AutoRule.countDocuments({
        guildId: interaction.guild.id,
        type: "respond"
      });

      if (count >= limit) {
        return interaction.reply({
          content: `❌ Limit reached. Free servers can use **5** auto responses. Premium servers can use **100**.`,
          ephemeral: true
        });
      }

      const exists = await AutoRule.findOne({
        guildId: interaction.guild.id,
        type: "respond",
        trigger
      });

      if (exists) {
        return interaction.reply({
          content: "❌ This trigger already exists.",
          ephemeral: true
        });
      }

      await AutoRule.create({
        guildId: interaction.guild.id,
        type: "respond",
        trigger,
        response,
        createdBy: interaction.user.id
      });

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("✅ Auto Response Added")
            .addFields(
              { name: "Trigger", value: trigger },
              { name: "Response", value: response }
            )
        ]
      });
    }

    if (sub === "remove") {
      const trigger = interaction.options.getString("trigger").toLowerCase();

      const deleted = await AutoRule.findOneAndDelete({
        guildId: interaction.guild.id,
        type: "respond",
        trigger
      });

      if (!deleted) {
        return interaction.reply({
          content: "❌ Trigger not found.",
          ephemeral: true
        });
      }

      return interaction.reply({
        content: `✅ Auto response removed: **${trigger}**`
      });
    }

    if (sub === "list") {
      const rules = await AutoRule.find({
        guildId: interaction.guild.id,
        type: "respond"
      });

      if (!rules.length) {
        return interaction.reply({
          content: "⚠️ No auto responses found.",
          ephemeral: true
        });
      }

      const list = rules
        .map((r, i) => `**${i + 1}.** Trigger: \`${r.trigger}\`\nResponse: ${r.response}`)
        .join("\n\n");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTitle("🤖 Auto Responses")
            .setDescription(list)
        ],
        ephemeral: true
      });
    }
  }
};