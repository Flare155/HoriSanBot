const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { clientIdMain } = require('./config.json');
const dotenv = require('dotenv');
require('dotenv').config();  // Load environment variables
const envFile = '.env.prod';

// Load environment variables from the selected .env file
const result = dotenv.config({ path: envFile });
if (result.error) {
  console.error(`Failed to load ${envFile}:`, result.error);
  process.exit(1);  // Exit the application if env file loading fails
}

const globalToken = process.env.TOKEN;

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const globalFoldersPath = path.join(foldersPath, 'global');

const rest = new REST().setToken(globalToken);

// Format data to be deployed
const globalCommandFiles = fs.readdirSync(globalFoldersPath).filter(file => file.endsWith('.js'));
for (const file of globalCommandFiles) {
  const filePath = path.join(globalFoldersPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Deploy the commands globally
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} global application (/) commands.`);
    const data = await rest.put(
      Routes.applicationCommands(clientIdMain),
      { body: commands },
    );
    console.log(`Successfully reloaded ${data.length} global application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
