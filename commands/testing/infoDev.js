const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const { mongoose } = require('mongoose');
const User = require("../../models/User");
const Log = require("../../models/Log");
const { testingServerId } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info_dev')
        .setDescription('Replies with your immersion info!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const exists = await User.exists({ userId: userId });
        let totalPoints = 0;

        // Exclude testing server data
        let testGuildExcludeMatch;
        if (guildId === testingServerId) {
            testGuildExcludeMatch = { $match: { guildId: testingServerId} }
        } else {
            testGuildExcludeMatch = { $match: { guildId: { $ne: testingServerId } } }
        };

        // Find total points
        if (exists) {
            totalPoints = await Log.aggregate([
                testGuildExcludeMatch,
                { $match: { userId: userId } },  // Only consider logs for this user
                { $group: { _id: "$userId", totalPoints: { $sum: "$points" } } },
                { $project: { totalPoints: 1, _id: 0 } }  // Only return totalPoints
            ]);

            if (totalPoints.length > 0) {
                totalPoints = totalPoints[0].totalPoints;
            } else {
                totalPoints = 0;
            }
        }

        // Reply
        if (exists) {
            // Embed response:
            const userAvatarURL = interaction.user.displayAvatarURL();
        
            // Make embed for log message
            const profileEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`${interaction.user.username}'s Profile`)
            .setDescription(`You have ${totalPoints} points!`)
            // .setDescription(descripton)
            .setThumbnail(userAvatarURL)
            
            // Send embed
            await interaction.reply({ embeds: [profileEmbed] });
        } else {
            await interaction.reply('User not found :(');
        };
    },
};
