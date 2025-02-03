const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Learn about the bot and overview of the commands!')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('The command you need help with')
        .setRequired(false)
        .addChoices(
          { name: 'log', value: 'log' },
          { name: 'backlog', value: 'backlog' },
          { name: 'logs', value: 'logs' },
          { name: 'profile', value: 'profile' },
          { name: 'leaderboard', value: 'leaderboard' },
          { name: 'undo', value: 'undo' },
          { name: 'editlog', value: 'editlog' },
          { name: 'deletelog', value: 'deletelog' },
          { name: 'selftimeout', value: 'selftimeout' },
          { name: 'settimezone', value: 'settimezone' }
        )
    ),
  async execute(interaction) {
    const command = interaction.options.getString('command');

    const helpMessages = {
      log: {
        title: '📝 Log Command',
        description: 'Log your immersion with a medium, title, amount, and notes.',
        usage: '/log [medium] [title] [amount] [notes] [episode length=21]',
        details: `Use this command to keep track of your immersion details such as books, movies, or other media.
* The [amount] field can be in episodes or raw minutes.
Examples: \`5ep\` (105 minutes), \`1h15m\` (75 minutes), \`5m30s\` (5.5 minutes)
* Suggested title formats:
  - YouTube: \`ChannelName Title\`
  - Anime: \`SeriesName Season\`
  - Podcast: \`Creator PodcastName\`
* Suggested note formats:
  - YouTube: \`[link]\`
  - Anime: \`eps[start]-[end]\`
  - Podcast: \`Episode [number] | [link]\`
`
      },
      backlog: {
        title: '⏪ Backlog Command',
        description: 'Log your past immersion with a medium, title, amount, date, and optional notes.',
        usage: '/backlog [medium] [amount] [title] [date] [notes] [episode_length]',
        details: `Use this command to log immersion details for past activities (books, movies, etc.) that you may have missed logging in real time.
* The [amount] field accepts either a duration (e.g., 1h30m, 45m, 2m5s) or a number of episodes (e.g., 5ep).
Examples:
  - \`5ep\` (for Anime: 5 episodes, each using a default or custom length)
  - \`1h15m\` (75 minutes)
  - \`45m\` (45 minutes)
* Suggested title formats:
  - YouTube: \`ChannelName Title\`
  - Anime: \`SeriesName Season\`
  - Podcast: \`Creator PodcastName\`
* Suggested note formats:
  - YouTube: \`[link]\`
  - Anime: \`eps[start]-[end]\`
  - Podcast: \`Episode [number] | [link]\`
* The [date] field should be in YYYY-MM-DD format. (Backlog entries are limited to activities within the past 40 years.)
`
      },
      logs: {
        title: '📜 Logs Command',
        description: 'View your log history and see IDs of logs.',
        usage: '/logs',
        details: 'Displays all your previous logs including their IDs, which can be used to delete or review entries.'
      },
      profile: {
        title: '👤 Profile Command',
        description: 'Display an overview of all your logged immersion.',
        usage: '/profile',
        details: 'Shows you an overview of your total immersion activities, including time spent on different media.'
      },
      leaderboard: {
        title: '🏆 Leaderboard Command',
        description: 'Display a leaderboard of the top players based on immersion points.',
        usage: '/leaderboard [period] [scope] [medium]',
        details: `Use this command to view the top players in immersion for a given time period and scope.
* **Period** can be: All Time, Yearly, Monthly, Weekly, or Daily.
* **Scope** determines which users are included: Global, This Server, or Friends.
* **Medium** filters by the type of immersion (e.g., All, Listening, Watchtime, YouTube, Anime, Readtime, Visual Novel, Manga, Speaking, Writing).
The leaderboard is interactive and supports pagination and time navigation.`
      },
      undo: {
        title: '↩️ Undo Command',
        description: 'Undo the most recent log. **Irreversible!**',
        usage: '/undo',
        details: 'This will remove your last logged entry. Be careful, as this action cannot be undone.'
      },
      editlog: {
        title: '✏️ Edit Log Command',
        description: 'Edit a specific log entry by its ID and update its amount, title, or notes.',
        usage: '/editlog [log_id] [amount] [title] [notes]',
        details: `Use this command to modify a previously logged entry.
* Provide the log ID along with any fields you wish to update. Fields that remain unchanged will be ignored.
* You will be prompted with interactive buttons to confirm or cancel the changes.`
      },
      deletelog: {
        title: '❌ Delete Log Command',
        description: 'Delete a specific log by its ID. **Irreversible!**',
        usage: '/deletelog [ID]',
        details: 'Use this command to permanently remove a log entry by its ID. Make sure to double-check before deleting!'
      },
      selftimeout: {
        title: '⏱️ Self Timeout Command',
        description: 'Time yourself out so you can focus on your immersion!',
        usage: '/selftimeout [duration] [activation time] [repeat count]',
        details: `* You can schedule the timeout to activate at a specific time and even have it repeat.
Example: \`/selftimeout 6h 10:30 PM 3\`
This will time you out for **6 hours** at **10:30 PM** for **3 days**.`
      },
      settimezone: {
        title: '🌍 Set Timezone Command',
        description: 'Set your timezone for streak tracking and personalized time-based features.',
        usage: '/settimezone [timezone]',
        details: `Use this command to set your timezone.
* Start typing to search for your timezone (e.g., America/New_York).
* The timezone should be provided in IANA format.`
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
        )
        .setFooter({ text: 'For additional assistance DM or mention @flarenotfound on Discord!' });

      return interaction.reply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor('#c3e0e8')
        .setTitle('📜 Bot Commands Overview')
        .setDescription('Use **/help [command]** for more details on a specific command.')
        .addFields(
          { name: '📝 `/log`', value: 'Log your immersion with a medium, title, amount, and notes.' },
          { name: '⏪ `/backlog`', value: 'Log your past immersion.' },
          { name: '📜 `/logs`', value: 'View your log history and see log IDs.' },
          { name: '👤 `/profile`', value: 'Display an overview of all your immersion.' },
          { name: '🏆 `/leaderboard`', value: 'View the top users with an interactive leaderboard.' },
          { name: '↩️ `/undo`', value: 'Undo your most recent log. **Irreversible!**' },
          { name: '✏️ `/editlog`', value: 'Edit a specific log by its ID, and update its fields.' },
          { name: '❌ `/deletelog`', value: 'Delete a specific log by its ID. **Irreversible!**' },
          { name: '⏱️ `/selftimeout`', value: 'Time yourself out so you can focus on your immersion' },
          { name: '🌍 `/settimezone`', value: 'Set your timezone for personalized time based features.' }
        )
        .setFooter({ text: 'Need more help? DM or mention @flarenotfound' });

      return interaction.reply({ embeds: [embed] });
    }
  },
};
