const { REST, Routes } = require('discord.js');
const { clientIdTest, clientIdMain, testingServerId, token, token2 } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const globalFoldersPath = path.join(foldersPath, 'global');
const testingFoldersPath = path.join(foldersPath, 'testing');

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token2);

// Deploy GLOBAL commands
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

rest = new REST().setToken(token); 

// Deploy TESTING commands
commands.length = 0; // Clear the commands array
const testingCommandFiles = fs.readdirSync(testingFoldersPath).filter(file => file.endsWith('.js'));
for (const file of testingCommandFiles) {
  const filePath = path.join(testingFoldersPath, file);
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
		console.log(`Started refreshing ${commands.length} testing application (/) commands.`);
		const data = await rest.put(
			Routes.applicationGuildCommands(clientIdTest, testingServerId),
			{ body: commands },
		);
		console.log(`Successfully reloaded ${data.length} testing application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
