const { SlashCommandBuilder } = require('discord.js');
const Log = require('../../models/Log');
const { testingServerId } = require('../../config.json');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('undo_dev')
        .setDescription('Removes your most recent log (cannot be undone)'),
    async execute(interaction) {
        // Determine which guildId to search for

        // Fetch the most recent log by the user with the determined guildId
        const log = await Log.findOne({ userId: interaction.user.id }).sort({ timestamp: -1 });

        // If there is a log, delete it
        if(log) {
            await Log.deleteOne({ _id: log._id });
            await interaction.reply('Your most recent log has been removed.');
        } else {
            await interaction.reply('You have no logs to remove.');
        }
    },
};