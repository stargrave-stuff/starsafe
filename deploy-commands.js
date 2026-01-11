// deploy-commands.js
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
dotenv.config();

const { REST, Routes } = require('discord.js');

const MODE = process.argv[2] || 'dev'; // dev | global | clear

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TOKEN  = process.env.DISCORD_TOKEN;

if (!CLIENT_ID || !TOKEN) {
  throw new Error('Missing CLIENT_ID or DISCORD_TOKEN in .env');
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
for (const file of files) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd?.data) commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

/** Helper: keep only fields valid for create/overwrite payloads */
function toCreateShape(cmd) {
  const keep = [
    'name',
    'type',
    'description',
    'options',
    'default_member_permissions',
    'nsfw',
    'dm_permission',                // deprecated but still accepted
    'contexts',
    'integration_types',
    'handler',                      // <- Entry Point handler (1 or 2)
    'name_localizations',
    'description_localizations',
  ];
  const out = {};
  for (const k of keep) if (cmd[k] !== undefined) out[k] = cmd[k];
  return out;
}

/** Helper: merge arrays of commands and dedupe by name (case-insensitive) */
function mergeByName(primary = [], preserve = []) {
  const map = new Map();
  for (const c of [...primary, ...preserve]) {
    if (!c?.name) continue;
    const key = c.name.toLowerCase();
    if (!map.has(key)) map.set(key, c);
  }
  return [...map.values()];
}

/** Detect special Entry Point commands (Activities) on a list response */
function findEntryPoints(list = []) {
  // Discord marks Entry Point commands with a numeric `handler` field.
  return list.filter(c => c && typeof c.handler !== 'undefined');
}

(async () => {
  try {
    if (MODE === 'clear') {
      console.log('Clearing GLOBAL slash commands…');

      // If Activities are enabled, delete Entry Point command(s) individually first.
      const existingGlobal = await rest.get(Routes.applicationCommands(CLIENT_ID));
      const globalEntryPts = findEntryPoints(existingGlobal);
      if (globalEntryPts.length) {
        console.log(
          `Found ${globalEntryPts.length} global Entry Point command(s): ${globalEntryPts.map(c => c.name).join(', ')}`
        );
        for (const ep of globalEntryPts) {
          await rest.delete(Routes.applicationCommand(CLIENT_ID, ep.id));
          console.log(`Deleted Entry Point "${ep.name}" (global)`);
        }
      }
      // Now bulk clear the rest
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });

      if (GUILD_ID) {
        console.log('Clearing GUILD slash commands…');
        const existingGuild = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));
        const guildEntryPts = findEntryPoints(existingGuild);
        if (guildEntryPts.length) {
          console.log(
            `Found ${guildEntryPts.length} guild Entry Point command(s): ${guildEntryPts.map(c => c.name).join(', ')}`
          );
          for (const ep of guildEntryPts) {
            await rest.delete(Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, ep.id));
            console.log(`Deleted Entry Point "${ep.name}" (guild)`);
          }
        }
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
      }
      console.log('Done.');
      return;
    }

    if (MODE === 'global') {
      console.log('Registering GLOBAL slash commands…');

      // Preserve Entry Point command(s) by fetching and appending them.
      const existingGlobal = await rest.get(Routes.applicationCommands(CLIENT_ID));
      const entryPts = findEntryPoints(existingGlobal).map(toCreateShape);

      if (entryPts.length) {
        console.log(
          `Preserving ${entryPts.length} Entry Point command(s): ${entryPts.map(c => c.name).join(', ')}`
        );
      }

      const payload = mergeByName(commands, entryPts);
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: payload });
      console.log('Deployed globally.');
      return;
    }

    // default: dev (guild)
    if (!GUILD_ID) {
      throw new Error('GUILD_ID missing in .env for dev registration.');
    }
    console.log(`Registering GUILD slash commands to ${GUILD_ID}…`);

    // Do the same preservation for guild scope, just in case
    const existingGuild = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));
    const guildEntryPts = findEntryPoints(existingGuild).map(toCreateShape);

    if (guildEntryPts.length) {
      console.log(
        `Preserving ${guildEntryPts.length} guild Entry Point command(s): ${guildEntryPts.map(c => c.name).join(', ')}`
      );
    }

    const payload = mergeByName(commands, guildEntryPts);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: payload });
    console.log('Deployed to guild.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
