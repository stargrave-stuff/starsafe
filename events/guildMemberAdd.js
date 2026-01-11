const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Blacklist = require('../models/Blacklist');
// --- ADD THIS IMPORT ---
const GuildSettings = require('../models/GuildSettings'); 
const { cancelledKicks } = require('./interactionCreate');
// You can now remove fs and path if they aren't used elsewhere

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            // 1. Search the database for the user
            const data = await Blacklist.findOne({ discordId: member.id });

            // Exit if user is not blacklisted
            if (!data) return;

            // --- FETCH SETTINGS FROM DATABASE ---
            // We search by guildId to find the settings saved via the dashboard
            const guildSettings = await GuildSettings.findOne({ guildId: member.guild.id });

            let logChannelId = guildSettings ? guildSettings.logChannelId : null;
            let kickTimerMinutes = guildSettings ? guildSettings.cooldown : 5; // Default to 5 if not set

            // Exit if no log channel is configured for this server
            if (!logChannelId) {
                console.error(`[Error] No log channel set for guild: ${member.guild.name}`);
                return;
            }

            const logChannel = member.guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            // Define delay based on Database setting
            const KICK_DELAY_MS = kickTimerMinutes * 60 * 1000; 

            console.log(`[Blacklist Alert] Detected ${member.user.tag} (${member.id}). Auto-kick set for ${kickTimerMinutes}m.`);

            // 2. Create the Buttons
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`dismiss_${member.id}`) 
                        .setLabel('Dismiss')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`kicknow_${member.id}`)
                        .setLabel('Kick NOW')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`bannow_${member.id}`)
                        .setLabel('Ban')
                        .setStyle(ButtonStyle.Danger)
                );

            // 3. Prepare the Embed for Staff
            const alertEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('⚠️ BLACKLISTED USER DETECTED')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'User Information', value: `<@${member.id}> (${member.user.tag})` },
                    { name: 'ID', value: `${member.id}` },
                    { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>` },
                    { name: 'Blacklisted On', value: data.dateAdded ? data.dateAdded.toLocaleDateString() : 'Unknown' },
                    { name: 'Reports', value: String(data.reports || 1) },
                    { name: 'Notes', value: `Please view the website for more detailed information.\nIf a button is not pressed, the user will be automatically kicked in ${kickTimerMinutes} minutes.` },
                    { name: 'Action Taken', value: '⏳ Pending Auto-Kick' }
                )
                .setFooter({ text: 'StarSafe Security System • Take appropriate action' })
                .setTimestamp();

            // 4. Send the Message
            let sentMessage = await logChannel.send({ embeds: [alertEmbed], components: [buttons] });

            // 5. The Dynamic Timer
            setTimeout(async () => {
                try {
                    // Check if staff already handled it
                    if (cancelledKicks.has(member.id)) {
                        cancelledKicks.delete(member.id); 
                        return;
                    }

                    // Double check they are still in server
                    const currentMember = await member.guild.members.fetch(member.id).catch(() => null);
                    if (!currentMember) return;

                    // Perform the Auto-Kick
                    if (currentMember.kickable) {
                        await currentMember.kick(`StarSafe Auto-kick: ${kickTimerMinutes} minute grace period expired.`);
                        
                        // Update the Embed and Remove Buttons
                        if (sentMessage) {
                            const autoKickEmbed = EmbedBuilder.from(alertEmbed)
                                .setColor('#57756f') // Gray
                                .spliceFields(-1, 1, { 
                                    name: 'Action Taken', 
                                    value: `🤖 **Automatically Kicked:** ${kickTimerMinutes}-minute grace period expired.` 
                                });
                            
                            await sentMessage.edit({ embeds: [autoKickEmbed], components: [] });
                        }
                    }
                } catch (err) {
                    console.error(`[Timer Error]`, err);
                }
            }, KICK_DELAY_MS);

        } catch (error) {
            console.error('Error in Blacklist Join Event:', error);
        }
    }
};