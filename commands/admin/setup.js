const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup the bot for your server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
async execute(interaction) {
        await interaction.reply({ 
            content: `Set up on the [website](https://starsafe.stargrave.xyz)`, ephemeral: true });
    },
};