const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const GuildSettings = require("../../models/GuildSettings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Manage server prefixes.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(sub =>
      sub.setName("list").setDescription("Show all prefixes.")
    )

    .addSubcommand(sub =>
      sub.setName("add")
        .setDescription("Add a prefix.")
        .addStringOption(o =>
          o.setName("prefix").setDescription("Prefix to add").setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub.setName("remove")
        .setDescription("Remove a prefix.")
        .addStringOption(o =>
          o.setName("prefix").setDescription("Prefix to remove").setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub.setName("default")
        .setDescription("Set default prefix.")
        .addStringOption(o =>
          o.setName("prefix").setDescription("Default prefix").setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    let settings = await GuildSettings.findOne({ guildId: interaction.guild.id });

    if (!settings) {
      settings = await GuildSettings.create({
        guildId: interaction.guild.id,
        prefixes: ["/"],
        defaultPrefix: "/"
      });
    }

    if (!settings.prefixes || !settings.prefixes.length) {
      settings.prefixes = [settings.prefix || "/"];
      settings.defaultPrefix = settings.defaultPrefix || settings.prefixes[0];
    }

    if (sub === "list") {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("⚙️ RUDRA Prefixes")
        .setDescription(settings.prefixes.map(p => `\`${p}\``).join(" "))
        .addFields({
          name: "Default Prefix",
          value: `\`${settings.defaultPrefix || settings.prefixes[0]}\``
        });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const prefix = interaction.options.getString("prefix").trim();

    if (!prefix || prefix.length > 5) {
      return interaction.reply({
        content: "❌ Prefix 1-5 characters ka hona chahiye.",
        ephemeral: true
      });
    }

    if (sub === "add") {
      if (settings.prefixes.includes(prefix)) {
        return interaction.reply({ content: "❌ Ye prefix already added hai.", ephemeral: true });
      }

      settings.prefixes.push(prefix);
      await settings.save();

      return interaction.reply({ content: `✅ Prefix added: \`${prefix}\``, ephemeral: true });
    }

    if (sub === "remove") {
      if (!settings.prefixes.includes(prefix)) {
        return interaction.reply({ content: "❌ Ye prefix list me nahi hai.", ephemeral: true });
      }

      if (settings.prefixes.length === 1) {
        return interaction.reply({ content: "❌ Last prefix remove nahi kar sakte.", ephemeral: true });
      }

      settings.prefixes = settings.prefixes.filter(p => p !== prefix);

      if (settings.defaultPrefix === prefix) {
        settings.defaultPrefix = settings.prefixes[0];
      }

      await settings.save();

      return interaction.reply({ content: `✅ Prefix removed: \`${prefix}\``, ephemeral: true });
    }

    if (sub === "default") {
      if (!settings.prefixes.includes(prefix)) {
        return interaction.reply({
          content: "❌ Pehle `/prefix add` se ye prefix add karo.",
          ephemeral: true
        });
      }

      settings.defaultPrefix = prefix;
      await settings.save();

      return interaction.reply({ content: `✅ Default prefix set: \`${prefix}\``, ephemeral: true });
    }
  }
};