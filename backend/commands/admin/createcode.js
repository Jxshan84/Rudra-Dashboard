const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const RedeemCode = require("../../models/RedeemCode");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createcode")
    .setDescription("Create a redeem code")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addStringOption(option =>
      option
        .setName("code")
        .setDescription("Redeem code")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("rewardtype")
        .setDescription("Reward Type")
        .setRequired(true)
        .addChoices(
          { name: "Coins", value: "coins" },
          { name: "Gems", value: "gems" },
          { name: "Premium Gems", value: "premiumgems" },
          { name: "XP", value: "xp" },
          { name: "Item", value: "item" },
          { name: "Role", value: "role" }
        )
    )

    .addIntegerOption(option =>
      option
        .setName("uses")
        .setDescription("Maximum uses")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("expiry")
        .setDescription("Example: 1h, 12h, 7d, 30d, never")
        .setRequired(true)
    )

    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Reward amount")
        .setRequired(false)
    )

    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Item name")
        .setRequired(false)
    )

    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("Discord role reward")
        .setRequired(false)
    )

    .addIntegerOption(option =>
      option
        .setName("maxredeemperuser")
        .setDescription("How many times one user can redeem")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "❌ You need Administrator permission to use this command.",
        ephemeral: true
      });
    }

    const code = interaction.options.getString("code").toUpperCase();
    const rewardType = interaction.options.getString("rewardtype");
    const uses = interaction.options.getInteger("uses");
    const expiry = interaction.options.getString("expiry").toLowerCase();

    const amount = interaction.options.getInteger("amount") || 0;
    const itemName = interaction.options.getString("item");
    const role = interaction.options.getRole("role");
    const maxRedeemPerUser =
      interaction.options.getInteger("maxredeemperuser") || 1;

    if (uses <= 0) {
      return interaction.reply({
        content: "❌ Uses must be greater than 0.",
        ephemeral: true
      });
    }

    if (maxRedeemPerUser <= 0) {
      return interaction.reply({
        content: "❌ Max redeem per user must be greater than 0.",
        ephemeral: true
      });
    }

    if (
      ["coins", "gems", "premiumgems", "xp"].includes(rewardType) &&
      amount <= 0
    ) {
      return interaction.reply({
        content: "❌ Amount is required and must be greater than 0 for this reward type.",
        ephemeral: true
      });
    }

    if (rewardType === "item" && !itemName) {
      return interaction.reply({
        content: "❌ Item name is required for item reward.",
        ephemeral: true
      });
    }

    if (rewardType === "role" && !role) {
      return interaction.reply({
        content: "❌ Role is required for role reward.",
        ephemeral: true
      });
    }

    const exists = await RedeemCode.findOne({ code });

    if (exists) {
      return interaction.reply({
        content: "❌ This redeem code already exists.",
        ephemeral: true
      });
    }

    let expiresAt = null;

    if (expiry !== "never") {
      const match = expiry.match(/^(\d+)([hd])$/);

      if (!match) {
        return interaction.reply({
          content: "❌ Expiry must be like 1h, 12h, 7d, 30d or never.",
          ephemeral: true
        });
      }

      const value = Number(match[1]);
      const unit = match[2];

      expiresAt = new Date();

      if (unit === "h") {
        expiresAt.setHours(expiresAt.getHours() + value);
      } else {
        expiresAt.setDate(expiresAt.getDate() + value);
      }
    }

    await RedeemCode.create({
      code,
      rewardType,
      amount,
      itemName: itemName || null,
      roleId: role ? role.id : null,
      uses,
      used: 0,
      expiresAt,
      maxRedeemPerUser,
      redeemedBy: [],
      createdBy: interaction.user.id
    });

    const rewardText =
      rewardType === "role"
        ? `${role}`
        : rewardType === "item"
        ? itemName
        : `${amount}`;

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🎁 Redeem Code Created")
      .addFields(
        { name: "Code", value: code, inline: true },
        { name: "Reward Type", value: rewardType, inline: true },
        { name: "Reward", value: rewardText, inline: true },
        { name: "Uses", value: `${uses}`, inline: true },
        { name: "Expiry", value: expiry, inline: true },
        { name: "Max Redeem / User", value: `${maxRedeemPerUser}`, inline: true }
      )
      .setFooter({ text: `Created by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};