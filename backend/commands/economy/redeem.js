const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const User = require("../../models/User");
const RedeemCode = require("../../models/RedeemCode");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("redeem")
    .setDescription("Redeem a server code")
    .addStringOption(o =>
      o.setName("code").setDescription("Redeem code").setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const codeInput = interaction.options.getString("code").toUpperCase();

    const redeemCode = await RedeemCode.findOne({
      guildId,
      code: codeInput
    });

    if (!redeemCode) {
      return interaction.reply({ content: "❌ Invalid code for this server.", ephemeral: true });
    }

    if (redeemCode.expiresAt && new Date() > redeemCode.expiresAt) {
      return interaction.reply({ content: "❌ This code has expired.", ephemeral: true });
    }

    if (redeemCode.used >= redeemCode.uses) {
      return interaction.reply({ content: "❌ This code reached its usage limit.", ephemeral: true });
    }

    const redeemedCount = redeemCode.redeemedBy.filter(id => id === interaction.user.id).length;

    if (redeemedCount >= redeemCode.maxRedeemPerUser) {
      return interaction.reply({ content: "❌ You already redeemed this code.", ephemeral: true });
    }

    let user = await User.findOne({ userId: interaction.user.id });
    if (!user) user = await User.create({ userId: interaction.user.id });

    if (redeemCode.rewardType === "coins") user.coins += redeemCode.amount;
    if (redeemCode.rewardType === "gems") user.gems += redeemCode.amount;
    if (redeemCode.rewardType === "premiumgems") user.premiumGems += redeemCode.amount;
    if (redeemCode.rewardType === "xp") user.xp += redeemCode.amount;

    if (redeemCode.rewardType === "item") {
      user.inventory.push(redeemCode.itemName);
    }

    if (redeemCode.rewardType === "role") {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(redeemCode.roleId).catch(() => null);
    }

    redeemCode.used += 1;
    redeemCode.redeemedBy.push(interaction.user.id);

    await user.save();
    await redeemCode.save();

    const rewardText =
      redeemCode.rewardType === "role"
        ? `<@&${redeemCode.roleId}>`
        : redeemCode.rewardType === "item"
        ? redeemCode.itemName
        : `${redeemCode.amount}`;

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🎉 Code Redeemed")
      .setDescription(`Successfully redeemed **${redeemCode.code}**`)
      .addFields(
        { name: "Reward Type", value: redeemCode.rewardType, inline: true },
        { name: "Reward", value: rewardText, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};