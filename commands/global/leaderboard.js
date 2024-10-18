const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Log = require('../../models/Log');
const { testingServerId } = require('../../config.json');
const { startDateCalculator } = require('../../utils/startDateCalculator');
const { toPoints } = require('../../utils/formatting/toPoints'); // Import the toPoints function

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show a leaderboard of the top players')
        .addStringOption(option =>
            option.setName('period')
                .setDescription('Time period of the leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'All Time', value: 'All Time' },
                    { name: 'Yearly', value: 'Yearly' },
                    { name: 'Monthly', value: 'Monthly' },
                    { name: 'Weekly', value: 'Weekly' },
                    { name: 'Daily', value: 'Daily' },
                ))
        .addStringOption(option =>
            option.setName('medium')
                .setDescription('The medium of the leaderboard')
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
        const medium = interaction.options.getString('medium');
        const guildId = interaction.guild.id;
        const timePeriod = interaction.options.getString('period');

        const startDate = startDateCalculator(timePeriod);
        console.log(startDate);
        const lowerTimeBoundMatch = {
            $match: {
                timestamp: { $gte: startDate },
            }
        };

        // Define subcategories for Watchtime and Readtime
        const watchtimeSubcategories = ['Watchtime', 'YouTube', 'Anime'];
        const readtimeSubcategories = ['Readtime', 'Manga', 'Visual Novel'];

        // Match stage for the medium
        let mediumMatch;
        if (medium === 'Watchtime') {
            mediumMatch = { $match: { medium: { $in: watchtimeSubcategories } } };
        } else if (medium === 'Readtime') {
            mediumMatch = { $match: { medium: { $in: readtimeSubcategories } } };
        } else if (medium !== 'All') {
            mediumMatch = { $match: { medium } };
        } else {
            mediumMatch = { $match: {} }; // No medium filter
        }

        // Exclude or include testing server data
        let testGuildExcludeMatch;
        if (guildId === testingServerId) {
            testGuildExcludeMatch = { $match: { guildId: testingServerId } };
        } else {
            testGuildExcludeMatch = { $match: { guildId: { $ne: testingServerId } } };
        }

        // Aggregation pipeline to get top users
        const topUsers = await Log.aggregate([
            testGuildExcludeMatch,
            lowerTimeBoundMatch,
            mediumMatch,
            {
                $group: {
                    _id: "$userId",
                    totalSeconds: { $sum: "$amount.totalSeconds" }
                }
            },
            { $sort: { totalSeconds: -1 } },
            { $limit: 10 }
        ]);

        // Aggregation to find all users and their positions
        const allUsers = await Log.aggregate([
            testGuildExcludeMatch,
            lowerTimeBoundMatch,
            mediumMatch,
            {
                $group: {
                    _id: "$userId",
                    totalSeconds: { $sum: "$amount.totalSeconds" }
                }
            },
            { $sort: { totalSeconds: -1 } }
        ]);

        // Fetch display names for top users
        const topTenNamesAndPoints = await Promise.all(topUsers.map(async (user) => {
            let discordUser;
            try {
                discordUser = await interaction.client.users.fetch(user._id);
            } catch {
                discordUser = { username: "Unknown User" };
            }
            return {
                displayName: discordUser.username,
                totalPoints: toPoints(user.totalSeconds) // Convert totalSeconds to points
            };
        }));

        // Find position and points of the current user
        const currentUserPosition = allUsers.findIndex(user => user._id === interaction.user.id) + 1;
        const currentUserData = allUsers.find(user => user._id === interaction.user.id);
        const currentUserPoints = currentUserData ? toPoints(currentUserData.totalSeconds) : 0; // Convert to points
        const currentDisplayName = interaction.user.username;

        // If not in top 10, adjust spacing
        let endspace = "";
        if (currentUserPosition > 10) {
            endspace = "\n‎";
        }

        // Create the leaderboard embed
        const leaderboardEmbed = new EmbedBuilder()
            .setColor('#c3e0e8')
            .setTitle(`${timePeriod} ${medium} Immersion Leaderboard`)
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
            .setThumbnail('https://media.giphy.com/media/vNY0UZX11LcNW/giphy.gif')
            .setTimestamp()
            .addFields(
                topTenNamesAndPoints.map((user, index) => ({
                    name: `${index + 1}. ${user.displayName}`,
                    value: `\`${user.totalPoints} points\`${index === 9 ? endspace : ""}`
                }))
            );

        if (currentUserPosition > 10) {
            leaderboardEmbed.addFields({
                name: `${currentUserPosition}. ${currentDisplayName}`,
                value: `\`${currentUserPoints} points\``
            });
        }

        // Send the embed
        await interaction.editReply({ embeds: [leaderboardEmbed] });
    },
};
