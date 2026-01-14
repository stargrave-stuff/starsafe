const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config()

const client = new Client({ intents: [
		    GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // THIS IS REQUIRED
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent]
});

client.commands = new Collection();

// Load slash commands
function getFilesRecursively(directory) {
    const filesInDirectory = fs.readdirSync(directory);
    let files = [];

    for (const file of filesInDirectory) {
        const absolutePath = path.join(directory, file);
        if (fs.statSync(absolutePath).isDirectory()) {
            files = files.concat(getFilesRecursively(absolutePath));
        } else if (file.endsWith('.js')) {
            files.push(absolutePath);
        }
    }
    return files;
}

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = getFilesRecursively(commandsPath);

for (const filePath of commandFiles) {
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`[LOADED] Command: ${command.data.name}`);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(process.env.DISCORD_TOKEN);