const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings'); // Ensure path is correct

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('View the current bot settings for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Fetch settings from Database
            const guildSettings = await GuildSettings.findOne({ guildId: interaction.guild.id });

            // Define variables with fallback defaults
            const logChannelDisplay = guildSettings?.logChannelId ? `<#${guildSettings.logChannelId}>` : '`Not Set`';
            const timer = guildSettings?.cooldown ?? 5; // Use 5 if null/undefined

            const settingsEmbed = new EmbedBuilder()
                .setColor(0x5865F2) // Blurple
                .setTitle('⚙️ StarSafe Server Settings')
                .setThumbnail(interaction.guild.iconURL())
                .addFields(
                    { name: 'Log Channel', value: logChannelDisplay, inline: true },
                    { name: 'Auto-Kick Timer', value: `\`${timer} Minutes\``, inline: true }
                )
                .setFooter({ text: 'Settings are synced with the StarSafe Dashboard' })
                .setTimestamp();

            await interaction.reply({ embeds: [settingsEmbed] });

        } catch (error) {
            console.error('Settings Command Error:', error);
            await interaction.reply({ content: '❌ Failed to retrieve settings from the database.', ephemeral: true });
        }
    },
};