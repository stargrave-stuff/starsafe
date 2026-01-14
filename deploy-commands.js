const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
dotenv.config();

const { REST, Routes } = require('discord.js');

const MODE = process.argv[2] || 'dev'; // dev | global | clear

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TOKEN = process.env.DISCORD_TOKEN;

if (!CLIENT_ID || !TOKEN) {
  throw new Error('Missing CLIENT_ID or DISCORD_TOKEN in .env');
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

/** * Helper: Recursively find all .js files in a directory 
 */
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

// Load all files including subdirectories
const allCommandFiles = getFilesRecursively(commandsPath);

for (const filePath of allCommandFiles) {
  const cmd = require(filePath);
  if (cmd?.data) {
    commands.push(cmd.data.toJSON());
    console.log(`Loaded: ${cmd.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

function toCreateShape(cmd) {
  const keep = ['name', 'type', 'description', 'options', 'default_member_permissions', 'nsfw', 'dm_permission', 'contexts', 'integration_types', 'handler', 'name_localizations', 'description_localizations'];
  const out = {};
  for (const k of keep) if (cmd[k] !== undefined) out[k] = cmd[k];
  return out;
}

function mergeByName(primary = [], preserve = []) {
  const map = new Map();
  for (const c of [...primary, ...preserve]) {
    if (!c?.name) continue;
    const key = c.name.toLowerCase();
    if (!map.has(key)) map.set(key, c);
  }
  return [...map.values()];
}

function findEntryPoints(list = []) {
  return list.filter(c => c && typeof c.handler !== 'undefined');
}

(async () => {
  try {
    if (MODE === 'clear') {
      console.log('Clearing commands...');
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
      if (GUILD_ID) await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
      console.log('Done.');
      return;
    }

    if (MODE === 'global') {
      const existingGlobal = await rest.get(Routes.applicationCommands(CLIENT_ID));
      const entryPts = findEntryPoints(existingGlobal).map(toCreateShape);
      const payload = mergeByName(commands, entryPts);
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: payload });
      console.log('Deployed globally.');
      return;
    }

    // Default: Dev
    const existingGuild = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));
    const guildEntryPts = findEntryPoints(existingGuild).map(toCreateShape);
    const payload = mergeByName(commands, guildEntryPts);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: payload });
    console.log(`Deployed to guild ${GUILD_ID}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();