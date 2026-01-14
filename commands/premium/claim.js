const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const PremiumCode = require("../../models/PremiumCode");
const User = require("../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Redeem a StarSafe premium code.")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("The code you wish to redeem (STR-XXX-XXX-XXX)")
        .setRequired(true)
    ),

  async execute(interaction) {
    // 1. Immediately defer to prevent "Unknown Interaction" timeout
    await interaction.deferReply({ ephemeral: true });

    const inputCode = interaction.options.getString("code").toUpperCase();

    try {
      // 2. Find the code in the database
      const codeData = await PremiumCode.findOne({ code: inputCode });

      if (!codeData) {
        return interaction.editReply({
          content:
            "❌ **Invalid Code:** That code does not exist in our database.",
        });
      }

      if (codeData.claimed) {
        return interaction.editReply({
          content:
            "❌ **Already Claimed:** This code has already been used by another user.",
        });
      }

      // 3. Calculate time to add
      let daysToAdd = 30; // Default for MLY (Monthly)
      let isLifetime = false;

      if (codeData.type === "lifetime" || inputCode.includes("LTM")) {
        daysToAdd = 36500; // ~100 years for LTM
        isLifetime = true;
      }

      // 4. Update the User's Premium Status
      let expiryDate = new Date();
      const existingUser = await User.findOne({
        discordId: interaction.user.id,
      });

      // If user already has active premium, we stack the time
      if (
        existingUser &&
        existingUser.premiumUntil &&
        existingUser.premiumUntil > new Date()
      ) {
        expiryDate = new Date(existingUser.premiumUntil);
      }

      expiryDate.setDate(expiryDate.getDate() + daysToAdd);

      await User.findOneAndUpdate(
        { discordId: interaction.user.id },
        {
          isPremium: true,
          premiumUntil: expiryDate,
        },
        { upsert: true }
      );

      // 5. Mark the code as claimed
      codeData.claimed = true;
      codeData.claimedBy = interaction.user.id;
      codeData.claimedAt = new Date();
      await codeData.save();

      // 6. Send Success Embed
      const successEmbed = new EmbedBuilder()
        .setTitle(
          isLifetime
            ? "💎 Lifetime Premium Activated!"
            : "🌟 Monthly Premium Activated!"
        )
        .setColor(isLifetime ? 0xf1c40f : 0x5865f2) // Gold for LTM, Blue for MLY
        .setDescription(
          `Congratulations! You have successfully redeemed your code.`
        )
        .addFields(
          { name: "Redeemed Code", value: `\`${inputCode}\``, inline: true },
          {
            name: "New Expiry Date",
            value: `<t:${Math.floor(expiryDate.getTime() / 1000)}:D>`,
            inline: true,
          }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: "StarSafe Security • Premium Member" })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Claim Error:", error);
      await interaction.editReply({
        content:
          "⚠️ An internal error occurred while processing your claim. Please try again later.",
      });
    }
  },
};