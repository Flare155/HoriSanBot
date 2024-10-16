const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Log = require('../../models/Log');
const { testingServerId } = require('../../config.json');
const { startDateCalculator } = require('../../utils/startDateCalculator'); // Import streak utility

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard_dev')
        .setDescription('Show a leaderboard of the top players')
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
    const guildId = interaction.guild.id
    const timePeriod = interaction.options.getString('period');
                    

    // Add to matchStage timestamp filter for all logs after the startDate
    startDate = startDateCalculator(timePeriod);
    let lowerTimeBoundMatch = {
        $match: { 
            timestamp: { $gte: startDate },
        }
    };

    // Define subcategories for Watchtime and Readtime
    const watchtimeSubcategories = ['Watchtime', 'YouTube', 'Anime'];
    const readtimeSubcategories = ['Readtime', 'Manga', 'Visual Novel'];

    // A match stage that matches the medium but if the medium is watchtime or readtime groups those together appropriately
    if (medium === 'Watchtime') {
        mediumMatch = { $match: { medium: { $in: watchtimeSubcategories } } };
    } else if (medium === 'Readtime') {
        mediumMatch = { $match: { medium: { $in: readtimeSubcategories } } };
    } else if (medium !== 'All') {
        // For any other specific medium, just match that one medium
        mediumMatch = { $match: { medium } };
    } else {
        // If medium is 'All', no need for a specific match on medium
        mediumMatch = { $match: {} }; // Empty match stage or just ignore it if it's not needed
    }

    // Seperate leaderboards from testing server data
    let testGuildExcludeMatch;
    if (guildId === testingServerId) {
        testGuildExcludeMatch = { $match: { guildId: testingServerId} };
    } else {
        testGuildExcludeMatch = { $match: { guildId: { $ne: testingServerId } } };
    }

    const topUsers = await Log.aggregate([
        testGuildExcludeMatch,
        lowerTimeBoundMatch,
        mediumMatch,
        { $group: { _id: "$userId", totalPoints: { $sum: "$points" } } },
        { $sort: { totalPoints: -1 } },
        { $limit: 10 }
    ]);
    
    // Find all users logs and sort by points, save as currentUser
    const currentUser = await Log.aggregate([
        testGuildExcludeMatch,
        lowerTimeBoundMatch,
        { $group: { _id: "$userId", totalPoints: { $sum: "$points" } } },
        { $sort: { totalPoints: -1 } }
    ]);

    const topTenNamesAndPoints = await Promise.all(topUsers.map(async user => {
        let discordUser = await interaction.client.users.fetch(user._id);
        return {
            displayName: discordUser.displayName,
            totalPoints: user.totalPoints
        };
    }));

    
    
    // Find position of current user, find their total points, get their displayName
    const currentUserPosition = currentUser.findIndex(user => user._id === interaction.user.id) + 1;
    const currentUserPoints = currentUser.find(user => user._id === interaction.user.id)?.totalPoints || 0;
    const currentdisplayName = interaction.user.displayName;

    // if not in top 10, dont make a space to prevent useless space at bottom of leaderboard
    let endspace = ""
    if (currentUserPosition > 10) {
        endspace = "\n‎"
    }

    // Make embed for log message
    const leaderboardEmbed = new EmbedBuilder()
    .setColor('#c3e0e8')
    .setTitle(`${timePeriod} ${medium} Immersion Leaderboard`)
    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
    .setThumbnail('https://media.giphy.com/media/vNY0UZX11LcNW/giphy.gif')
    .setTimestamp()
    .addFields(
        // Zero space unicode character after last name to add a space
        topTenNamesAndPoints.map((user, index) => ({
            name: `${index + 1}. ${user.displayName}`,
            value: `\`${user.totalPoints} points\`${index==9 ? endspace : ""}`
        }))
    );

    if (currentUserPosition > 10) {
        leaderboardEmbed.addFields({ 
            name: `${currentUserPosition}. ${currentdisplayName}`, 
            value: `\`${currentUserPoints} points\``
        });
    };
    
    // Send embed
    await interaction.editReply({ embeds: [leaderboardEmbed] });
},
};
