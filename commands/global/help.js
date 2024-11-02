const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Learn about the bot and overview of the commands!')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command you need help with')
                .setRequired(false) // Optional to allow general help overview
                .addChoices(
                    { name: 'help', value: 'help' },
                    { name: 'log', value: 'log' },
                    { name: 'logs', value: 'logs' },
                    { name: 'undo', value: 'undo' },
                    { name: 'deletelog', value: 'deletelog' },
                    { name: 'profile', value: 'profile' },
                    { name: 'graph', value: 'graph' },
                    { name: 'selftimeout', value: 'selftimeout' }
                )
        ),
    async execute(interaction) {
        const command = interaction.options.getString('command');
        const helpMessages = {
            help: {
                title: '💡 Help Command',
                description: 'Provides information about the bot and an overview of all available commands.',
                usage: '/help [command]',
                details: 'Use this command to get details on specific commands or to view the list of all commands.'
            },
            log: {
                title: '📝 Log Command',
                description: 'Log your immersion with a medium, title, amount, and notes.',
                usage: '/log [medium] [title] [amount] [notes] [episode length=21]',
                details: `Use this command to keep track of your immersion details such as books, movies, or other media.
Use this command to keep track of your immersion details such as books, movies, or other media.
* The [amount] field can be in episodes or in raw minutes.
Examples: `5ep`(21*5=105) `1h15m` (75) `5m30s` (5.5) 
* Suggested title format: 
YouTube: `ChannelName Title`
Anime:    `SeriesName Season`
Podcast: `Creator PodcastName`
etc.
* Suggested note format:
YouTube: `[link]`
Anime:     `eps[start]-[end]`
Podcast: `Episode [number] | [link]`
-# For any additional assistance DM or @ flarenotfound on discord!
                    `
            },
            logs: {
                title: '📜 Logs Command',
                description: 'View your log history and see IDs of logs.',
                usage: '/logs',
                details: 'Displays all your previous logs including their IDs, which can be used to delete or review entries.'
            },
            undo: {
                title: '↩️ Undo Command',
                description: 'Undo the last log you created. **Irreversible!**',
                usage: '/undo',
                details: 'This will remove your last logged entry. Be careful, as this action cannot be undone.'
            },
            deletelog: {
                title: '❌ Delete Log Command',
                description: 'Delete a specific log by its ID. **Irreversible!**',
                usage: '/deletelog [ID]',
                details: 'Use this command to permanently remove a log entry by its ID. Make sure to double-check before deleting!'
            },
            profile: {
                title: '👤 Profile Command',
                description: 'Display an overview of all your logged immersion.',
                usage: '/profile',
                details: 'Shows you an overview of your total immersion activities, including time spent on different media.'
            },
            graph: {
                title: '📊 Graph Command',
                description: 'Visualize your immersion with a graph.',
                usage: '/graph [time period]',
                details: 'Generates a graph to visualize your immersion history over time.'
            },
            selftimeout: {
                title: '⏱️ Self Timeout Command',
                description: 'Time yourself out so you can focus on your immersion!',
                usage: '/selftimeout [minutes]',
                details: 'Blocks you from interacting with the bot for a set amount of time to help you focus on your immersion.'
            }
        };

        if (command) {
            const helpMessage = helpMessages[command];
            const embed = new EmbedBuilder()
                .setColor('#c3e0e8')
                .setTitle(helpMessage.title)
                .setDescription(helpMessage.description)
                .addFields(
                    { name: 'Usage', value: `\`${helpMessage.usage}\`` },
                    { name: 'Details', value: helpMessage.details } 
                    // Can add any sort of details or additional information about each option inside the command here
                )
                .setFooter({ text: 'For any additional assistance DM or @ flarenotfound on discord!' });

            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#c3e0e8')
                .setTitle('📜 Bot Commands Overview')
                .setDescription('Here is a list of commands you can use with this bot:\nUse **/help [command]** for detailed info on a specific command.\n​')
                .addFields(
                    { name: '💡 `/help`', value: 'Learn about the bot and overview of the commands.', inline: false },
                    { name: '📝 `/log`', value: 'Log your immersion with a medium, title, amount, and notes.', inline: false },
                    { name: '📜 `/logs`', value: 'View your log history and see IDs of logs.', inline: false },
                    { name: '↩️ `/undo`', value: 'Undo the last log you created. **Irreversible!**', inline: false },
                    { name: '❌ `/deletelog`', value: 'Delete a specific log by its ID. **Irreversible!**', inline: false },
                    { name: '👤 `/profile`', value: 'Display an overview of all your logged immersion', inline: false },
                    { name: '📊 `/graph`', value: 'Visualize your immersion with a graph.', inline: false },
                    { name: '⏱️ `/selftimeout`', value: 'Time yourself out so you can focus on your immersion!', inline: false }
                )
                .setFooter({ text: 'For any additional assistance DM or @ flarenotfound on discord!' });

            await interaction.reply({ embeds: [embed] });
        }
    },
};
