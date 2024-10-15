const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require("../../models/User");
const Log = require("../../models/Log");
const { testingServerId } = require('../../config.json');
const { calculateStreak } = require('../../utils/streakCalculator'); // Import streak utility

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile_dev')
        .setDescription('Replies with your immersion info!')
        .addStringOption(option =>
            option.setName('period')
                .setDescription('Time period of the leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'All Time', value: 'All Time' },
                    { name: 'Yearly', value: 'Yearly'},
                    { name: 'Monthly', value: 'Monthly'},
                    { name: 'Weekly', value: 'Weekly' },
                    { name: 'Daily', value: 'Daily' },
                    )),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const timePeriod = interaction.options.getString('period');
        const exists = await User.exists({ userId: userId });
        const userTimezone = userData ? userData.timezone : 'UTC';
        const pointsByDate = await immersionByDate(userId, days, userTimezone);

        let logStats = [];
        let totalPoints = 0;
        let streak = 0;
        let mangaPages = 0;
        let charactersRead = 0;

        // Exclude testing server data
        let testGuildExcludeMatch;
        if (guildId === testingServerId) {
            testGuildExcludeMatch = { $match: { guildId: testingServerId } };
        } else {
            testGuildExcludeMatch = { $match: { guildId: { $ne: testingServerId } } };
        }

        // Find total points and calculate streak if user exists
        if (exists) {
            // Calculate the streak dynamically based on logs
            streak = await calculateStreak(userId, guildId);

            // Update the user's streak in the database
            await User.updateOne({ userId }, { streak });

            // Query for total points
            const totalPointsResult = await Log.aggregate([
                testGuildExcludeMatch,
                { $match: { userId: userId } },
                { $group: { _id: null, total: { $sum: "$points" } } }
            ]);

            // Assign total points, if no points assign zero
            totalPoints = totalPointsResult.length > 0 ? totalPointsResult[0].total : 0;

            // Query for genres and their amounts
            logStats = await Log.aggregate([
                testGuildExcludeMatch,
                { $match: { userId: userId } },
                { $group: { _id: { medium: "$medium", user: "$userId" }, total: { $sum: "$amount" }, units: { $push: "$unit" } } }
            ]);
        }

        const fieldOrder = {
            // Audio
            Listening: "Minutes",
            // Audio-Visual
            Watchtime: "Minutes",
            YouTube: "Minutes",
            Anime: "Episodes",
            // Reading
            Readtime: "Minutes",
            "Visual Novel": "Minutes",
            Manga: "Minutes",
        };

        // Sort logStats based on the defined fieldOrder
        logStats.sort((a, b) => {
            // Get the index of each medium in the fieldOrder
            const indexA = Object.keys(fieldOrder).indexOf(a._id.medium);
            const indexB = Object.keys(fieldOrder).indexOf(b._id.medium);

            // Sort by the index; if not found, it will be pushed to the end
            return indexA - indexB;
        });

        // Calculate estimates for manga pages and characters read
        logStats.forEach(stat => {
            if (stat._id.medium === 'Manga') {
                // Assume 5 pages per minute of Manga reading
                mangaPages = stat.total * 5;
            } else if (stat._id.medium === 'Readtime' || stat._id.medium === 'Visual Novel') {
                // Assume 500 characters read per minute
                charactersRead += stat.total * 500;
            }
        });

        // Reply
        if (exists) {
            // Embed response:
            const userAvatarURL = interaction.user.displayAvatarURL();
        
            // Make embed for log message
            const profileEmbed = new EmbedBuilder()
                .setColor('#c3e0e8')
                .setTitle(`${interaction.user.displayName}'s Immersion Profile`)
                .setThumbnail(userAvatarURL)
                .setTimestamp()
                .setFooter({ text: 'Keep up the great work!', iconURL: userAvatarURL });

            // Add total points field
            profileEmbed.addFields({ name: "🏆 Total Points", value: `${totalPoints}`, inline: true });
            
            // Add streak field
            profileEmbed.addFields({ name: "🔥 Current Streak", value: `${streak} days`, inline: true });

            // Add genre-specific fields in a more separate section
            if (logStats.length > 0) {
                const genresDescription = logStats.map(stat => {
                    const unit = fieldOrder[stat._id.medium] || 'Units';
                    return `**${stat._id.medium}**: ${stat.total} ${unit}`;
                }).join('\n');
                
                profileEmbed.addFields({ name: "📚 Immersion Breakdown", value: genresDescription, inline: false });
            }

            // Add estimates for manga pages and characters read
            if (mangaPages > 0) {
                profileEmbed.addFields({ name: "📖 Estimated Manga Pages", value: `${mangaPages} pages`, inline: false });
            }
            if (charactersRead > 0) {
                profileEmbed.addFields({ name: "🔠 Estimated Characters Read", value: `${charactersRead} characters`, inline: false });
            }
            
            // Send embed
            await interaction.reply({ embeds: [profileEmbed] });
        } else {
            await interaction.reply({ content: 'User not found 😞', ephemeral: true });
        }
    },
};
