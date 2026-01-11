const { Events, ActivityType } = require('discord.js');
// IMPORTANT: We need BOTH functions from the task file now
const { 
    startStatsScheduler, 
    pushBotStats // <-- Assuming this function is now exported
} = require('../bot-stats-task'); 
const connectDB = require('../db/db-init');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) { // Make execute async for fetch calls
        connectDB();
        console.log(`Ready! Logged in as ${client.user.tag}`);

        // --- NEW: ROTATING PRESENCE ---
//        const activities = [
//            { name: `Global Blacklist`, type: ActivityType.Watching },
//            { name: `/help`, type: ActivityType.Listening },
//            { name: `Security Audit`, type: ActivityType.Playing }
//        ];
        
//        let i = 0;
//        setInterval(() => {
//            // Update the index
//            i = (i + 1) % activities.length;
//
            // Set the presence
//            client.user.setPresence({
//                activities: [activities[i]],
//                status: 'idle',
//            });
//        }, 30000); // Swaps every 30,000ms (30 seconds)

        // Initial set so it doesn't wait 30 seconds to show up
//        client.user.setPresence({ activities: [activities[0]], status: 'idle' });

        // --- 1. IMMEDIATE INITIAL STATS PUSH ---
        console.log('Running immediate initial bot stats push...');
        
        // Call the push function directly, no setTimeout needed here.
        await pushBotStats(client); 
        
        // --- 2. START THE SCHEDULED TASK ---
        // This function sets up the cron job for every 15 minutes AFTER the initial push
        startStatsScheduler(client); 
    },
};