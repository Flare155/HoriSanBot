const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash command interactions
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
            }
        }

        // Handle autocomplete interactions
        else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found for autocomplete.`);
                return;
            }

            // Check if the command has an autocomplete method and execute it
            if (command.autocomplete) {
                try {
                    await command.autocomplete(interaction);
                } catch (error) {
                    console.error(`Error handling autocomplete for ${interaction.commandName}`);
                    console.error(error);
                }
            }
        }
    },
};
