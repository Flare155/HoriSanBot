const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const User = require("../../models/User");
const Log = require("../../models/Log");
const { DateTime } = require('luxon'); // Replacing Moment with Luxon
const { calculateStreak } = require('../../utils/streakCalculator');
const { buildImage } = require('../../utils/buildImage');
const { startDateCalculator } = require('../../utils/startDateCalculator');
const { immersionByTimePeriod } = require('../../utils/graph-data/immersionByTimePeriod');
const { toPoints } = require('../../utils/formatting/toPoints'); // Import toPoints function

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Replies with your immersion info!')
        .addStringOption(option =>
            option.setName('period')
                .setDescription('Time period of the data to display')
                .setRequired(true)
                .addChoices(
                    { name: 'All Time', value: 'All Time' },
                    { name: 'Yearly', value: 'Yearly' },
                    { name: 'Monthly', value: 'Monthly' },
                    { name: 'Weekly', value: 'Weekly' },
                ))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Optionally input a user to see other peoples information')
                .setRequired(false)
            ),
    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user') || interaction.user;
        const userId = user.id;
        const guildId = interaction.guild.id;
        const timePeriod = interaction.options.getString('period');
        const exists = await User.exists({ userId: userId });
        const userData = await User.findOne({ userId: userId});
        const userTimezone = userData ? userData.timezone : 'UTC';

        let logStats = [];
        let totalPoints = 0;
        let streak = 0;
        let mangaPages = 0;
        let charactersRead = 0;
        let startDateUTC, endDateUTC;


        // Calculate startDate based on timePeriod using Luxon
        if (timePeriod === 'All Time') {
            // Get the timestamp of the first log
            const firstLog = await Log.aggregate([
                { $match: { userId: userId } },
                { $sort: { timestamp: 1 } }, // Sort logs by timestamp, earliest first
                { $limit: 1 } // Limit the result to the first log
            ]);
            if (firstLog.length > 0) {
                const startDate = DateTime.fromJSDate(firstLog[0].timestamp).setZone(userTimezone).startOf('day');
                startDateUTC = startDate.toUTC().toJSDate(); // Convert to UTC and then to native JS Date
            } else {
                // User has no logs at all
                await interaction.editReply({ content: 'User has no logs yet! Start logging your immersion with the `/log` command.', ephemeral: true });
                return;
            }
        } else {
            startDateUTC = startDateCalculator(timePeriod, userTimezone);
        }

        // Get the current time in the user's timezone for endDate
        const endDate = DateTime.now().setZone(userTimezone).endOf('day');
        endDateUTC = endDate.toUTC().toJSDate(); // Convert to UTC

        const lowerTimeBoundMatch = {
            $match: {
                timestamp: { $gte: startDateUTC },
            }
        };
        console.log(endDateUTC);
        console.log(startDateUTC);

        // Find total points and calculate streak if user exists
        if (exists) {
            // Calculate the streak dynamically based on logs
            streak = await calculateStreak(userId, guildId);

            // Update the user's streak in the database
            await User.updateOne({ userId }, { streak });

            // Query for total points
            const totalPointsResult = await Log.aggregate([
                lowerTimeBoundMatch,
                { $match: { userId: userId } },
                { $group: { _id: null, totalSeconds: { $sum: "$amount.totalSeconds" } } }
            ]);

            // Assign total points (converted to points)
            totalPoints = totalPointsResult.length > 0 ? toPoints(totalPointsResult[0].totalSeconds) : 0;

            // Query for genres and their amounts
            logStats = await Log.aggregate([
                lowerTimeBoundMatch,
                { $match: { userId: userId } },
                {
                    $group: {
                        _id: { medium: "$medium" },
                        totalSeconds: { $sum: "$amount.totalSeconds" },
                        totalEpisodes: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$amount.unit", "Episodes"] },
                                    "$amount.count",
                                    0
                                ]
                            }
                        }
                    }
                }
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
            const indexA = Object.keys(fieldOrder).indexOf(a._id.medium);
            const indexB = Object.keys(fieldOrder).indexOf(b._id.medium);
            return indexA - indexB;
        });

        // Calculate estimates for manga pages and characters read
        logStats.forEach(stat => {
            const medium = stat._id.medium;
            if (medium === 'Manga') {
                const minutes = Math.floor(stat.totalSeconds / 60);
                mangaPages += minutes * 5; // Assume 5 pages per minute
            } else if (medium === 'Readtime' || medium === 'Visual Novel') {
                const minutes = Math.floor(stat.totalSeconds / 60);
                charactersRead += minutes * 500; // Assume 500 characters per minute
            }
        });

        // Build genresDescription
        const genresDescription = logStats.map(stat => {
            const medium = stat._id.medium;
            let value = "";
            if (medium === 'Anime') {
                value = `${stat.totalEpisodes} Episodes`;
            } else {
                const minutes = Math.floor(stat.totalSeconds / 60);
                value = `${minutes} Minutes`;
            }
            return `**${medium}**: ${value}`;
        }).join('\n');

        // Reply
        if (exists) {
            // Embed response:
            const userAvatarURL = user.displayAvatarURL({ dynamic: true });

            // Create embed for the profile
            const profileEmbed = new EmbedBuilder()
                .setColor('#c3e0e8')
                .setTitle(`${user.displayName}'s ${timePeriod} Immersion Profile`)
                .setThumbnail(userAvatarURL)
                .setImage('attachment://image.png')
                .setFooter({ text: `Keep up the great work!  •  Displayed in ${userTimezone} time`, iconURL: userAvatarURL });

            // Add total points field
            profileEmbed.addFields({ name: "🏆 Total Points", value: `${totalPoints}`, inline: true });

            // Add streak field
            profileEmbed.addFields({ name: "🔥 Current Streak", value: `${streak} days`, inline: true });

            // Add genre-specific fields
            if (logStats.length > 0) {
                profileEmbed.addFields({ name: "📚 Immersion Breakdown", value: genresDescription, inline: false });
            }

            // Add estimates for manga pages and characters read
            if (mangaPages > 0) {
                profileEmbed.addFields({ name: "📖 Estimated Manga Pages", value: `${mangaPages} pages`, inline: false });
            }
            if (charactersRead > 0) {
                profileEmbed.addFields({ name: "🔠 Estimated Characters Read", value: `${charactersRead} characters`, inline: false });
            }

            // Send the embed
            await interaction.editReply({ embeds: [profileEmbed] });

            // Create chart for profile
            const graphData = await immersionByTimePeriod(userId, startDateUTC, endDateUTC, userTimezone);
            const image = await buildImage("immersionTime", { data: graphData });
            // Assuming `image` is your Uint8Array
            const buffer = Buffer.from(image);
            // Create an attachment from the buffer
            const attachment = new AttachmentBuilder(buffer, { name: 'image.png' });

            // Edit the reply to include the image
            await interaction.editReply({ files: [attachment] });
        } else {
            await interaction.editReply({ content: 'User not found 😞', ephemeral: true });
        }
    },
};
