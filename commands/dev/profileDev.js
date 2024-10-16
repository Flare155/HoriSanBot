const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require("../../models/User");
const Log = require("../../models/Log");
const { testingServerId } = require('../../config.json');
const { calculateStreak } = require('../../utils/streakCalculator'); // Import streak utility
const { getLogsByDate } = require('../../utils/db/dbLogsByDate');
const { buildImage } = require('../../utils/buildImage');
const { startDateCalculator } = require('../../utils/startDateCalculator'); // Import streak utility


module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile_dev')
        .setDescription('Replies with your immersion info!')
        .addStringOption(option =>
            option.setName('period')
                .setDescription('Time period of the data to display')
                .setRequired(true)
                .addChoices(
                    { name: 'All Time', value: 'All Time' },
                    { name: 'Yearly', value: 'Yearly'},
                    { name: 'Monthly', value: 'Monthly'},
                    { name: 'Weekly', value: 'Weekly' },
                    )),
    async execute(interaction) {
        await interaction.deferReply();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        let timePeriod = interaction.options.getString('period');
        const exists = await User.exists({ userId: userId });
        const userData = await User.findOne({ userId: interaction.user.id });
        const userTimezone = userData ? userData.timezone : 'UTC';

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

        // TODO Rework getting the timestamp of the first log to be included in the query for all logs
        // Add lowerTimeBoundMatch timestamp filter for all logs after the startDate
        if (timePeriod === 'All Time') {
            const firstLog = await Log.aggregate([
                testGuildExcludeMatch,
                { $match: { userId: interaction.user.id } },
                { $sort: { timestamp: 1 } }, // Sort logs by timestamp, earliest first
                { $limit: 1 } // Limit the result to the first log
            ]);
            startDate = firstLog.timestamp
            console.log(firstLog);
        } else {
            startDate = startDateCalculator(timePeriod);
        }
        let lowerTimeBoundMatch = {
            $match: { 
                timestamp: { $gte: startDate },
            }
        };
        let now = new Date();
        let millisecondsPerDay = 86400000;
        let days = Math.floor((now - startDate) / millisecondsPerDay);
        console.log(days);


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
                lowerTimeBoundMatch,
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
                .setTitle(`${interaction.user.displayName}'s ${timePeriod} Day Period Immersion Profile`)
                .setThumbnail(userAvatarURL)
                .setTimestamp()
                .setImage('attachment://image.png')
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
            await interaction.editReply({ embeds: [profileEmbed] });

            // Create chart for profile
            const logsByDate = await getLogsByDate(userId, days, userTimezone, guildId);
            const image = await buildImage("immersionTime", { data: logsByDate });
            // Assuming `image` is your Uint8Array
            const buffer = Buffer.from(image);
            // Create an attachment from the buffer
            const attachment = new AttachmentBuilder(buffer,
                {
                    name: 'image.png'
                } );

            await interaction.editReply({ files: [attachment] });

        } else {
            await interaction.editReply({ content: 'User not found 😞', ephemeral: true });
        }
    },
};
