const fs = require('fs');
const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const Log = require('../../models/Log');
const { testingServerId } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Sends your log history!')
    .addStringOption(option =>
      option.setName('medium')
        .setDescription('Medium for filtering')
        .setRequired(true)
        .addChoices(
            { name: 'All', value: 'All' },
            { name: 'Anime', value: 'Anime' },
            { name: 'Drama', value: 'Drama'},
            { name: 'Manga', value: 'Manga' },
            { name: 'YouTube', value: 'YouTube' },
            { name: 'LN', value: 'Light Novel' },
            { name: 'VN', value: 'Visual Novel' },
            { name: 'Podcast', value: 'Podcast' },
            { name: 'Reading Characters', value: 'Reading Char'},
            { name: 'Reading Minutes', value: 'Reading Min'},
            { name: 'Listening', value: 'Listening'},
            )),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      let logs;
      const medium = interaction.options.getString('medium');
      if (medium == "All") {
        logs = await Log.find({ 
          userId: interaction.user.id,
          guildId: interaction.guild.id === testingServerId ? testingServerId : { $ne: testingServerId } 
        });
      } else {
        logs = await Log.find({ 
          userId: interaction.user.id,
          guildId: interaction.guild.id === testingServerId ? testingServerId : { $ne: testingServerId },
          medium: medium
        });
      };

      if (!logs || logs.length === 0) {
        return interaction.editReply(`No logs of medium ${medium} found`);
      }
      
      // Sort logs by timestamp in descending order (newest first)
      logs.sort((a, b) => b.timestamp - a.timestamp);

      // Runs for every log in logs and saves them to an array
      const formattedLogs = logs.map((log) => {

        // Format time
        let formattedDate = log.timestamp.getUTCFullYear() +
        '-' + String(log.timestamp.getUTCMonth() + 1).padStart(2, '0') +
        '-' + String(log.timestamp.getUTCDate()).padStart(2, '0');
        
        let formattedAmount = `(${log.amount} ${log.unit})`;
        // Only include Title and Notes if they are present
        let title = log.title || 'N/A';
        let notes = log.notes || 'N/A';

        let logString = `⏤⏤⏤⏤⏤⏤\nID: ${log._id}\n${formattedDate}\nMedium: ${log.medium} ${formattedAmount}`;
        if (title != 'N/A') {
          logString += `\nTitle: ${title}`;
        };
        if (notes != 'N/A') {
          logString += `\nNotes: ${notes}`;
        };
        return logString;
      });
      const logText = formattedLogs.join('\n');
      fs.writeFileSync('logs.txt', logText);
      const attachment = new AttachmentBuilder('./logs.txt');
      interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error(error);
      interaction.editReply('Error fetching logs');
    }
  },
};