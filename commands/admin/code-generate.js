const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const PremiumCode = require("../../models/PremiumCode");
const crypto = require("crypto");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("code-generate")
    .setDescription("Generate a premium code.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The duration of the premium code")
        .setRequired(true)
        .addChoices(
          { name: "Monthly (STR-MLY)", value: "MLY" },
          { name: "Lifetime (STR-LTM)", value: "LTM" }
        )
    ),

  async execute(interaction) {
    // 1. Tell Discord to wait immediately
    await interaction.deferReply({ ephemeral: true });

    const type = interaction.options.getString("type");

    // Helper to generate 3 random alphanumeric characters
    const block = () =>
      crypto
        .randomBytes(3)
        .toString("base64")
        .replace(/[^A-Z0-9]/gi, "")
        .slice(0, 3)
        .toUpperCase();

    // Build the code: STR - TYPE - XXX - XXX
    const codeString = `STR-${type}-${block()}-${block()}`;

    try {
      await PremiumCode.create({
        code: codeString,
        // We store the type in the DB so the /claim command knows how much time to give
        type: type === "LTM" ? "lifetime" : "monthly",
      });

      await interaction.editReply({
        content: `✅ **${
          type === "LTM" ? "Lifetime" : "Monthly"
        } Code Generated:**\n\`${codeString}\``,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: 'Database error. Make sure your Model has the "type" field!',
        ephemeral: true,
      });
    }
  },
};
