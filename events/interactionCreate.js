const { Events, EmbedBuilder } = require('discord.js');
const Blacklist = require('../models/Blacklist');

const cancelledKicks = new Set();

module.exports = {
    cancelledKicks,
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
            }
        } else if (interaction.isButton()) {
            const [action, targetId] = interaction.customId.split('_');
            const guild = interaction.guild;

            const updateEmbedAction = async (statusText, color) => {
                const originalEmbed = interaction.message.embeds[0];
                if (!originalEmbed) return;

                const editedEmbed = EmbedBuilder.from(originalEmbed)
                    .setColor(color)
                    .spliceFields(-1, 1, { name: 'Action Taken', value: statusText });

                await interaction.message.edit({ embeds: [editedEmbed], components: [] });
            };

            try {
                if (action === `dismiss`) {
                    cancelledKicks.add(targetId);
                    await updateEmbedAction(`✅ **Dismissed:** Allowed by ${interaction.user.tag}`, 0x00FF00);
                    return await interaction.reply({ content: `✅ **Bypassed:** <@${targetId}> is allowed to stay.`, ephemeral: true });
                }

                if (action === `kicknow`) {
                    cancelledKicks.add(targetId);
                    const member = await guild.members.fetch(targetId).catch(() => null);
                    if (member && member.kickable) await member.kick(`Immediate kick by ${interaction.user.tag}`);
                    
                    await updateEmbedAction(`🛑 **Kicked:** Removed by ${interaction.user.tag}`, 0xFFAA00);
                    return await interaction.reply({ content: `🛑 <@${targetId}> was removed.`, ephemeral: true });
                }

                if (action === `bannow`) {
                    cancelledKicks.add(targetId);
                    await guild.members.ban(targetId, { reason: `Global Blacklist Ban by ${interaction.user.tag}` });
                    
                    await updateEmbedAction(`🔨 **Banned:** Banned by ${interaction.user.tag}`, 0x000000);
                    return await interaction.reply({ content: `🔨 <@${targetId}> has been banned.`, ephemeral: true });
                }
            } catch (error) {
                console.error('Button Error:', error);
                if (!interaction.replied) await interaction.reply({ content: 'Action failed. Check bot permissions.', ephemeral: true });
            }
        }
    }
};