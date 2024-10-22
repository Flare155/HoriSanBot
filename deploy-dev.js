const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { clientIdTest, testingServerId } = require('./config.json');
const dotenv = require('dotenv');
require('dotenv').config();  // Load environment variables
const envFile = '.env.dev';

// Load environment variables from the selected .env file
const result = dotenv.config({ path: envFile });
if (result.error) {
  console.error(`Failed to load ${envFile}:`, result.error);
  process.exit(1);  // Exit the application if env file loading fails
}


const devToken = process.env.TOKEN;

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const devFoldersPath = path.join(foldersPath, 'dev');

const rest = new REST().setToken(devToken);

// Format data to be deployed
const devCommandFiles = fs.readdirSync(devFoldersPath).filter(file => file.endsWith('.js'));
for (const file of devCommandFiles) {
  const filePath = path.join(devFoldersPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Deploy the commands to the testing server
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} dev application (/) commands.`);
    const data = await rest.put(
      Routes.applicationGuildCommands(clientIdTest, testingServerId),
      { body: commands },
    );
    console.log(`Successfully reloaded ${data.length} dev application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
