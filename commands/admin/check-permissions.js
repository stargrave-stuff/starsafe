const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check-permissions')
        .setDescription('Verify the bot has all required permissions to function.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const botMember = interaction.guild.members.me;
        
        const requiredPerms = [
            { perm: PermissionFlagsBits.ViewChannel, name: 'View Channels' },
            { perm: PermissionFlagsBits.SendMessages, name: 'Send Messages' },
            { perm: PermissionFlagsBits.EmbedLinks, name: 'Embed Links' },
            { perm: PermissionFlagsBits.KickMembers, name: 'Kick Members' },
            { perm: PermissionFlagsBits.BanMembers, name: 'Ban Members' },
            { perm: PermissionFlagsBits.ManageMessages, name: 'Manage Messages (to edit/delete)' }
        ];

        let statusList = '';
        requiredPerms.forEach(p => {
            const hasPerm = botMember.permissions.has(p.perm);
            statusList += `${hasPerm ? '✅' : '❌'} **${p.name}**\n`;
        });

        // Hierarchy Check
        const botRole = botMember.roles.highest;
        
        const permEmbed = new EmbedBuilder()
            .setTitle('🛡️ Bot Permission Audit')
            .setColor(botMember.permissions.has(PermissionFlagsBits.KickMembers) ? 0x00FF00 : 0xFF0000)
            .addFields(
                { name: 'Required Permissions', value: statusList },
                { name: 'Highest Role', value: `${botRole.name} (Position: ${botRole.position})` },
                { name: 'System Note', value: 'Ensure the bot role is dragged to the top of the role list to kick/ban effectively.' }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [permEmbed] });
    },
};