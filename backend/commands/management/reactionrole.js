const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const ReactionRole = require("../../models/ReactionRole");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Manage reaction roles.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)

    .addSubcommand(sub =>
      sub
        .setName("create")
        .setDescription("Create a new reaction role message.")
        .addChannelOption(o =>
          o.setName("channel").setDescription("Channel").setRequired(true)
        )
        .addRoleOption(o =>
          o.setName("role").setDescription("Role to give").setRequired(true)
        )
        .addStringOption(o =>
          o.setName("emoji").setDescription("Emoji").setRequired(true)
        )
        .addStringOption(o =>
          o.setName("title").setDescription("Embed title").setRequired(false)
        )
        .addStringOption(o =>
          o.setName("description").setDescription("Embed description").setRequired(false)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("add-existing")
        .setDescription("Add reaction role to an existing message.")
        .addChannelOption(o =>
          o.setName("channel").setDescription("Message channel").setRequired(true)
        )
        .addStringOption(o =>
          o.setName("message_id").setDescription("Message ID").setRequired(true)
        )
        .addRoleOption(o =>
          o.setName("role").setDescription("Role to give").setRequired(true)
        )
        .addStringOption(o =>
          o.setName("emoji").setDescription("Emoji").setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("list")
        .setDescription("List reaction roles in this server.")
    )

    .addSubcommand(sub =>
      sub
        .setName("delete")
        .setDescription("Delete reaction role by database ID.")
        .addStringOption(o =>
          o.setName("id").setDescription("Reaction role ID from list").setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      await interaction.deferReply({ ephemeral: true });

      const channel = interaction.options.getChannel("channel");
      const role = interaction.options.getRole("role");
      const emoji = interaction.options.getString("emoji");
      const title = interaction.options.getString("title") || "Reaction Roles";
      const description =
        interaction.options.getString("description") || "React below to receive your role.";

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(title)
        .setDescription(description)
        .addFields({
          name: "Available Role",
          value: `${emoji} ${role}`
        })
        .setFooter({ text: "Powered by RUDRA" })
        .setTimestamp();

      const msg = await channel.send({ embeds: [embed] });
      await msg.react(emoji);

      await ReactionRole.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: msg.id,
        title,
        description,
        color: "#ff0000",
        footer: "Powered by RUDRA",
        type: "normal",
        roles: [
          {
            emoji,
            roleId: role.id,
            label: role.name,
            description: ""
          }
        ],
        createdBy: interaction.user.id
      });

      return interaction.editReply("✅ Reaction role message created.");
    }

    if (sub === "add-existing") {
      await interaction.deferReply({ ephemeral: true });

      const channel = interaction.options.getChannel("channel");
      const messageId = interaction.options.getString("message_id");
      const role = interaction.options.getRole("role");
      const emoji = interaction.options.getString("emoji");

      const msg = await channel.messages.fetch(messageId);
      await msg.react(emoji);

      await ReactionRole.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId,
        title: "Existing Message Reaction Role",
        description: "",
        type: "normal",
        roles: [
          {
            emoji,
            roleId: role.id,
            label: role.name,
            description: ""
          }
        ],
        createdBy: interaction.user.id
      });

      return interaction.editReply("✅ Reaction role added to existing message.");
    }

    if (sub === "list") {
      const data = await ReactionRole.find({
        guildId: interaction.guild.id
      }).sort({ createdAt: -1 });

      if (!data.length) {
        return interaction.reply({
          content: "No reaction roles found.",
          ephemeral: true
        });
      }

      const text = data
        .slice(0, 10)
        .map(rr => {
          const roles = rr.roles.map(r => `${r.emoji} <@&${r.roleId}>`).join(", ");
          return `ID: \`${rr._id}\`\nMessage: \`${rr.messageId}\`\n${roles}`;
        })
        .join("\n\n");

      return interaction.reply({
        content: text,
        ephemeral: true
      });
    }

    if (sub === "delete") {
      const id = interaction.options.getString("id");

      await ReactionRole.findByIdAndDelete(id);

      return interaction.reply({
        content: "✅ Reaction role deleted.",
        ephemeral: true
      });
    }
  }
};