const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User"); // Adjust path to your user model

module.exports = {
  data: new SlashCommandBuilder()
    .setName("premium-status")
    .setDescription("Check your current StarSafe Premium subscription status."),

  async execute(interaction) {
    const userData = await User.findOne({ discordId: interaction.user.id });

    const noPremiumEmbed = new EmbedBuilder()
      .setTitle("💎 StarSafe Premium")
      .setColor(0xff4b4b)
      .setDescription(
        "You do not currently have an active Premium subscription."
      )
      .addFields({
        name: "Benefits",
        value: "• Custom Log Colors\n• Priority Support\n• Advanced Auto-Mod",
      });

    if (!userData || !userData.isPremium || !userData.premiumUntil) {
      return interaction.reply({ embeds: [noPremiumEmbed], ephemeral: true });
    }

    const now = new Date();
    const expiration = new Date(userData.premiumUntil);

    if (expiration < now) {
      return interaction.reply({ embeds: [noPremiumEmbed], ephemeral: true });
    }

    // Calculate days remaining
    const diffTime = Math.abs(expiration - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const statusEmbed = new EmbedBuilder()
      .setTitle("💎 Premium Status: Active")
      .setColor(0xf1c40f)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        {
          name: "Expires On",
          value: `<t:${Math.floor(expiration.getTime() / 1000)}:D>`,
          inline: true,
        },
        { name: "Days Remaining", value: `\`${diffDays} Days\``, inline: true }
      )
      .setFooter({ text: "Thank you for supporting StarSafe!" });

    await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
  },
};
