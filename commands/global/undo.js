const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const { logToCommandConverter } = require('../../utils/logToCommandConverter');
const Log = require('../../models/Log');
const User = require('../../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('undo')
        .setDescription('Removes your most recent log (cannot be undone)'),
    async execute(interaction) {
        // Determine which guildId to search for
        // Fetch the most recent log by the user with the determined guildId
        const log = await Log.findOne({ userId: interaction.user.id }).sort({ timestamp: -1 });
        const user = await User.findOne({ userId: interaction.user.id });
        const iconURL = interaction.user.displayAvatarURL();
        // If there is a log, delete it
        if (log) {
            await Log.deleteOne({ _id: log._id });
            const embed = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setTitle('Your most recent log has been removed')
                .setDescription('Execute the following command to add the log again')
                .setTimestamp()
                .setFields([
                    {
                        name: 'command',
                        value: `${logToCommandConverter(log, user?.timezone ?? 'UTC')}`
                    }
                ])
                .setFooter({
                    text: 'Keep up the good work!',
                    iconURL
                });
            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor(Colors.Orange)
                .setFooter({
                    text: `Use /log to get started!`,
                    iconURL
                })
                .setTitle('You have no logs to remove.');
            await interaction.reply({ embeds: [embed] });
        }
    },
};
