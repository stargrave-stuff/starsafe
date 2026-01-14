const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const PremiumCode = require("../../models/PremiumCode");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("codes-list")
    .setDescription("Display all premium codes and their status.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // Fetch all codes from the database
      const allCodes = await PremiumCode.find({});

      if (!allCodes || allCodes.length === 0) {
        return interaction.reply({
          content: "❌ No codes found in the database.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("📋 StarSafe Premium Codes")
        .setColor(0x5865f2)
        .setTimestamp();

      // Group codes into strings based on status
      let unclaimed = "";
      let claimed = "";

      allCodes.forEach((item) => {
        const statusLine = `\`${item.code}\`${
          item.claimedBy ? ` (by <@${item.claimedBy}>)` : ""
        }\n`;
        if (item.claimed) {
          claimed += statusLine;
        } else {
          unclaimed += statusLine;
        }
      });

      embed.addFields(
        {
          name: "🎟️ Unclaimed Codes",
          value: unclaimed || "None",
          inline: false,
        },
        { name: "✅ Claimed Codes", value: claimed || "None", inline: false }
      );

      // Discord has a 1024 character limit per field.
      // If you have TONS of codes, we should warn the user.
      if (unclaimed.length > 1000 || claimed.length > 1000) {
        return interaction.reply({
          content:
            "⚠️ Too many codes to display in one embed. Showing partial list.",
          embeds: [embed],
          ephemeral: true,
        });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while fetching codes.",
        ephemeral: true,
      });
    }
  },
};
