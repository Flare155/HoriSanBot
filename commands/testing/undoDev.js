const { SlashCommandBuilder } = require('discord.js');
const Log = require('../../models/Log');
const { testingServerId } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('undo_dev')
        .setDescription('Removes your most recent log'),
    async execute(interaction) {
        // Determine which guildId to search for
        let guildIdCondition;
        if (interaction.guild.id === testingServerId) {
            guildIdCondition = testingServerId;
        } else {
            guildIdCondition = { $ne: testingServerId };
        }

        // Fetch the most recent log by the user with the determined guildId
        const log = await Log.findOne({ userId: interaction.user.id, guildId: guildIdCondition }).sort({ timestamp: -1 });

        // If there is a log, delete it
        if(log) {
            await Log.deleteOne({ _id: log._id });
            await interaction.reply('Your most recent log has been removed.');
        } else {
            await interaction.reply('You have no logs to remove.');
        }
    },
};
