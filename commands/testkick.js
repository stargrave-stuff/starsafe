const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testkick')
        .setDescription('Simulates a blacklisted user joining')
        .addUserOption(option => option.setName('target').setDescription('The user to test on').setRequired(true)),
    async execute(interaction) {
        const targetMember = interaction.options.getMember('target');
        const event = require('../events/guildMemberAdd');
        
        await interaction.reply({ content: `🧪 Simulating join event for ${targetMember.user.tag}...`, ephemeral: true });
        
        // This manually triggers your guildMemberAdd logic
        await event.execute(targetMember);
    },
};