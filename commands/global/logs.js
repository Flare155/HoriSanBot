const fs = require('fs');
const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const Log = require('../../models/Log');
const { testingServerId } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Sends your log history!'),
  async execute(interaction) {
    try {
      const logs = await Log.find({ 
        userId: interaction.user.id,
        guildId: interaction.guild.id === testingServerId ? testingServerId : { $ne: testingServerId } 
    });

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

        let logString = `⏤⏤⏤⏤⏤⏤\n${formattedDate}\nMedium: ${log.medium} ${formattedAmount}`;
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
      interaction.reply({ files: [attachment] });
    } catch (error) {
      console.error(error);
      interaction.reply('Error fetching logs');
    }
  },
};