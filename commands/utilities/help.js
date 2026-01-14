const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all commands organized by category.'),

    async execute(interaction) {
        const { commands } = interaction.client;
        
        // Check if the user has Administrator permissions
        const isUserAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        const helpEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🛡️ StarSafe Support & Commands')
            .setDescription('StarSafe protects your community using a global blacklist database.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setTimestamp();

        const commandsPath = path.join(__dirname, '..');
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            
            if (fs.statSync(folderPath).isDirectory()) {
                // HIDE LOGIC: If the folder is 'admin' or 'dev' and user is NOT an admin, skip it
                const hiddenFolders = ['admin', 'dev', 'staff'];
                if (hiddenFolders.includes(folder.toLowerCase()) && !isUserAdmin) {
                    continue; 
                }

                const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
                const categoryCommands = [];

                for (const file of commandFiles) {
                    const commandName = file.split('.')[0];
                    const command = commands.get(commandName);
                    
                    if (command) {
                        categoryCommands.push(`\`/${command.data.name}\` - ${command.data.description}`);
                    }
                }

                if (categoryCommands.length > 0) {
                    const categoryName = folder.charAt(0).toUpperCase() + folder.slice(1);
                    helpEmbed.addFields({ 
                        name: `${categoryName} Commands`, 
                        value: categoryCommands.join('\n') 
                    });
                }
            }
        }

        // Help section for admins
        if (isUserAdmin) {
            helpEmbed.addFields({ 
                name: '📝 Admin Quick-Start', 
                value: 'When a blacklisted user joins, you have **5 minutes** to use the action buttons. Default action is an automated kick.' 
            });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('StarSafe Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://starsafe.stargrave.xyz')
            );

        await interaction.reply({ embeds: [helpEmbed], components: [row], ephemeral: true });
    },
};