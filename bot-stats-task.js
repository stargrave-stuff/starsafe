// bot-stats-task.js

const cron = require('node-cron');
// Load environment variables on the bot's host

// --- Configuration ---
const API_URL = process.env.WEBSITE_API_URL; // e.g., "https://starsafe-site.com/api/bot/update-stats"
const BOT_UPDATE_SECRET = process.env.BOT_UPDATE_SECRET; // The SAME secret key
const BOT_ID_STRING = "StarSafeBot"; // Must match the ID used in the server's database query

function startStatsScheduler(client) {
    if (!API_URL || !BOT_UPDATE_SECRET) {
        console.error("FATAL: API_URL or BOT_UPDATE_SECRET not set in bot environment.");
        return;
    }

    // Schedule the task to run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        if (client.isReady()) {
            console.log('Running scheduled bot stats PUSH...');
            await pushBotStats(client);
        } else {
            console.log('Bot client is not ready, skipping stats push.');
        }
    });
    
    // Initial run
    client.once('ready', () => {
        setTimeout(() => pushBotStats(client), 5000); 
    });
}

async function pushBotStats(client) {
    try {
        let serverCount, guildIds;

        // Force a fresh fetch from the Discord API to get all 66 guilds
        const guilds = await client.guilds.fetch();
        serverCount = guilds.size;
        guildIds = guilds.map(g => g.id);

        console.log(`[BOT-STATS] Real Count: ${serverCount} Servers`);

        const payload = {
            botId: "StarSafeBot",
            serverCount: serverCount,
            latency: `${Math.round(client.ws.ping)}ms`,
            guildIds: guildIds
            // totalMembers removed per your request
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bot-secret': process.env.BOT_UPDATE_SECRET
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 429) {
    console.error("[RATE LIMIT] The server told us to slow down. Skipping this update.");
    return; // Stop here and wait for the next interval
}

       // 1. Get the raw text first to avoid crashing on HTML
const rawText = await response.text();
let data;

try {
    data = JSON.parse(rawText);
} catch (e) {
    // If we are here, the server sent HTML (likely a 404 or 500 error)
    console.error(`[ERROR] Server returned HTML instead of JSON. Status: ${response.status}`);
    console.log("HTML Preview:", rawText.substring(0, 100)); 
    return; // Stop execution
}

// 2. Now check if the response was successful
if (response.ok) {
    console.log(`[${new Date().toLocaleTimeString()}] Stats PUSHED successfully.`);
} else {
    console.error(`[${new Date().toLocaleTimeString()}] PUSH Failed. Status: ${response.status}. Message: ${data.message || 'Unknown'}`);
}
    } catch (err) {
        console.error("Bot failed to gather stats:", err);
    }
}
module.exports = { startStatsScheduler, pushBotStats };