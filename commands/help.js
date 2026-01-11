const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all commands and information about StarSafe.'),

    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🛡️ StarSafe Support & Commands')
            .setDescription('StarSafe protects your community using a global blacklist database and automated moderation tools.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { 
                    name: 'Admin Commands', 
                    value: '`/check-permissions` - Verify bot permissions and role hierarchy.\n`/settings` - View current log channel and bot status.\n`/setup` - Set up StarSafe in your server.' 
                },
                { 
                    name: 'User Commands', 
                    value: '`/ping` - Replies with Pong to check bot responsiveness.\n`/help` - Displays this help message.' 
                },
                { 
                    name: '📝 How it Works (admins)', 
                    value: 'When a blacklisted user joins, an alert is sent to your log channel. You have **5 minutes** to use the buttons to **Dismiss**, **Kick**, or **Ban**. If no action is taken, the bot will automatically kick the user.' 
                }
            )
            .setFooter({ text: 'StarSafe Security System • Take appropriate action' })
            .setTimestamp();

        // Adding the Link Button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('StarSafe Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://starsafe.stargrave.xyz') // Replace with your actual URL
            );

        await interaction.reply({ embeds: [helpEmbed], components: [row], ephemeral: true });
    },
};