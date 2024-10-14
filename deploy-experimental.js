const { REST, Routes } = require('discord.js');
const { clientIdTest, testingServerId, experimentalToken } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const globalFoldersPath = path.join(foldersPath, 'global');
const experimentalFoldersPath = path.join(foldersPath, 'experimental');

const rest = new REST().setToken(experimentalToken);

// Deploy Experimental commands
commands.length = 0; // Clear the commands array
const experimentalCommandFiles = fs.readdirSync(experimentalFoldersPath).filter(file => file.endsWith('.js'));
for (const file of experimentalCommandFiles) {
  const filePath = path.join(experimentalFoldersPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Deploy the commands to the experimental server
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} experimental application (/) commands.`);
    const data = await rest.put(
      Routes.applicationGuildCommands(clientIdTest, testingServerId),
      { body: commands },
    );
    console.log(`Successfully reloaded ${data.length} experimental application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
