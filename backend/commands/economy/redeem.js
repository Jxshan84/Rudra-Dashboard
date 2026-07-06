const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const User = require("../../models/User");
const RedeemCode = require("../../models/RedeemCode");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("redeem")
    .setDescription("Redeem a code")
    .addStringOption(option =>
      option
        .setName("code")
        .setDescription("Redeem Code")
        .setRequired(true)
    ),

  async execute(interaction) {

    const codeInput = interaction.options
      .getString("code")
      .toUpperCase();

    const redeemCode = await RedeemCode.findOne({
      code: codeInput
    });

    if (!redeemCode) {
      return interaction.reply({
        content: "❌ Invalid redeem code.",
        ephemeral: true
      });
    }

    if (
      redeemCode.expiresAt &&
      new Date() > redeemCode.expiresAt
    ) {
      return interaction.reply({
        content: "❌ This redeem code has expired.",
        ephemeral: true
      });
    }

    if (redeemCode.used >= redeemCode.uses) {
      return interaction.reply({
        content: "❌ This redeem code has reached its usage limit.",
        ephemeral: true
      });
    }

    let user = await User.findOne({
      userId: interaction.user.id
    });

    if (!user) {
      user = await User.create({
        userId: interaction.user.id
      });
    }

    const alreadyRedeemed =
      redeemCode.redeemedBy.filter(
        id => id === interaction.user.id
      ).length;

    if (
      alreadyRedeemed >=
      redeemCode.maxRedeemPerUser
    ) {
      return interaction.reply({
        content:
          "❌ You have already redeemed this code the maximum number of times.",
        ephemeral: true
      });
    }

    switch (redeemCode.rewardType) {

      case "coins":
        user.coins += redeemCode.amount;
        break;

      case "gems":
        user.gems += redeemCode.amount;
        break;

      case "premiumgems":
        user.premiumGems += redeemCode.amount;
        break;

      case "xp":
        user.xp += redeemCode.amount;
        break;

      case "role":
        if (redeemCode.roleId) {
          const member = await interaction.guild.members.fetch(interaction.user.id);
          await member.roles.add(redeemCode.roleId);
        }
        break;

      case "item":
        user.inventory.push(redeemCode.itemName);
        break;

    }

    redeemCode.used++;

    redeemCode.redeemedBy.push(
      interaction.user.id
    );

    await redeemCode.save();
    await user.save();

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🎉 Redeem Successful")
      .setDescription(
        `Successfully redeemed **${redeemCode.code}**`
      )
      .addFields(
        {
          name: "Reward",
          value: redeemCode.rewardType,
          inline: true
        },
        {
          name: "Amount",
          value:
            redeemCode.rewardType === "role"
              ? "<@&" + redeemCode.roleId + ">"
              : redeemCode.rewardType === "item"
              ? redeemCode.itemName
              : String(redeemCode.amount),
          inline: true
        }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });

  }
};