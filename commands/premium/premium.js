const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Get information about premium features.'),
    async execute(interaction) {
        const exampleEmbed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle("Premium Information and Perks")
          .setDescription("Some premium perks include:")
          .addFields(
            { name: "Exclusive Features", value: "Access to special commands and functionalities." },
            { name: "Priority Support", value: "Get help faster with our priority support." },
            { name: "Customizations", value: "Unlock custom themes and settings." },
          )
          .setTimestamp();

        await interaction.reply({ embeds: [exampleEmbed] });
    },
};