const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../data/settings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup the bot for your server.')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel for logs')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('timer')
                .setDescription('Auto-kick delay in minutes (Default: 5)')
                .setMinValue(1)
                .setMaxValue(60)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const timerMinutes = interaction.options.getInteger('timer');
        
        let settings = {};
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }

        if (!settings[interaction.guild.id]) {
            settings[interaction.guild.id] = { logChannel: null, kickTimer: 5 };
        }

        // Update values if provided
        if (channel) settings[interaction.guild.id].logChannel = channel.id;
        if (timerMinutes) settings[interaction.guild.id].kickTimer = timerMinutes;

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4));

        await interaction.reply({ 
            content: `✅ Settings updated: Log Channel: ${channel || 'Unchanged'}, Timer: ${timerMinutes ? timerMinutes + 'm' : 'Unchanged'}.`, 
            ephemeral: true 
        });
    },
};