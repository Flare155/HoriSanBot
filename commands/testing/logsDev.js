const fs = require('fs');
const { AttachmentBuilder, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Log = require('../../models/Log');
const User = require('../../models/User');  // Import the User model
const { testingServerId } = require('../../config.json');
const { localTimeConverter } = require('../../utils/localTimeConverter'); // Import streak utility

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs_dev')
    .setDescription('Sends your log history!')
    .addStringOption(option =>
      option.setName('medium')
        .setDescription('Medium for filtering')
        .setRequired(true)
        .addChoices(
          { name: 'All', value: 'All' },
          // Audio
          { name: 'Listening', value: 'Listening' },
          // Audio-Visual
          { name: 'Watchtime', value: 'Watchtime' },
          { name: 'YouTube', value: 'YouTube' },
          { name: 'Anime', value: 'Anime' },
          // Reading
          { name: 'Readtime', value: 'Readtime' },
          { name: 'Visual Novel', value: 'Visual Novel' },
          { name: 'Manga', value: 'Manga' },
        )),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const medium = interaction.options.getString('medium');

      // Fetch the user's timezone from the database
      const userData = await User.findOne({ userId: interaction.user.id });
      const userTimezone = userData ? userData.timezone : 'UTC';

      // Fetch logs based on the medium filter
      let logs;
      if (medium == "All") {
        logs = await Log.find({
          userId: interaction.user.id,
          guildId: interaction.guild.id === testingServerId ? testingServerId : { $ne: testingServerId },
        });
      } else {
        logs = await Log.find({
          userId: interaction.user.id,
          guildId: interaction.guild.id === testingServerId ? testingServerId : { $ne: testingServerId },
          medium: medium
        });
      }

      if (!logs || logs.length === 0) {
        return interaction.editReply(`No logs of medium ${medium} found`);
      }

      // Sort logs by timestamp in descending order (newest first)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Slice to get the first three logs
      const firstThreeLogs = logs.slice(0, 3);

      // Display the first 3 logs in a detailed embed
      const embed = new EmbedBuilder()
        .setColor('#c3e0e8')
        .setTitle(`${interaction.user.displayName}'s Recent Logs (${medium})`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Use /undo or /deletelog to remove a log' });

      // Iterate over the first three logs
      firstThreeLogs.forEach((log) => {
        // Format time using the user's timezone, without seconds
        const formattedDate = localTimeConverter(log.timestamp, userTimezone);
        const formattedAmount = `${log.amount} ${log.unit}`;
        const title = log.title || 'N/A';
        const notes = log.notes || 'N/A';

        embed.addFields({
          name: `\`${formattedDate}\``,
          value: `**Medium**: ${log.medium}
          **Amount**: ${formattedAmount}
          **Title**: ${title}
          **Notes**: ${notes !== 'N/A' ? notes : 'No notes provided'}
          **ID**: ${log._id}\n`
        });
      });

      // Send the embed
      await interaction.editReply({ embeds: [embed] });

      // Create and send the full log history as a text file
      const formattedLogs = logs.map((log) => {
        const formattedDate = localTimeConverter(log.timestamp, userTimezone);
        let formattedAmount = `(${log.amount} ${log.unit})`;
        let title = log.title || 'N/A';
        let notes = log.notes || 'N/A';

        let logString = `⏤⏤⏤⏤⏤⏤\n${formattedDate}\nMedium: ${log.medium} ${formattedAmount}`;
        if (title != 'N/A') {
          logString += `\nTitle: ${title}`;
        };
        if (notes != 'N/A') {
          logString += `\nNotes: ${notes}`;
        };
        logString += `\nID: ${log._id}`;
        return logString;
      });

      const logText = formattedLogs.join('\n');
      fs.writeFileSync('logs.txt', logText);
      const attachment = new AttachmentBuilder('./logs.txt');
      interaction.followUp({ files: [attachment] });

    } catch (error) {
      console.error(error);
      interaction.editReply('Error fetching logs');
    }
  },
};
