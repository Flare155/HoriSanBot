const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Log = require('../../models/Log');
const { testingServerId } = require('../../config.json');

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
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Drama', value: 'Drama'},
                    { name: 'Manga', value: 'Manga' },
                    { name: 'YouTube', value: 'YouTube' },
                    { name: 'LN', value: 'Light Novel' },
                    { name: 'VN', value: 'Visual Novel' },
                    { name: 'Podcast', value: 'Podcast' },
                    { name: 'Reading Minutes', value: 'Reading'},
                    { name: 'Listening Minutes', value: 'Listening'},
                    )),
    async execute(interaction) {
        const medium = interaction.options.getString('medium');
        const guildId = interaction.guild.id
                        
        // Get the data from the time period
        let now = new Date();
        let startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));        


        switch(timePeriod) {
            case 'All Time':
                startDate = new Date(0); // Beginning of Unix time
                break;
            case 'Yearly':
                startDate = new Date(startDate.getFullYear(), 0); // Start of this year
                break;
            case 'Monthly':
                startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1); // Start of this month
                break;
            case 'Weekly':
                // We're using the getDay() function, which returns the day of the week (0 for Sunday, 1 for Monday, etc.)
                // By subtracting this from the current date, we get the last Sunday
                startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - startDate.getDay());
                break;
            case 'Daily':
                startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()); // Start of today
                break;
        };

        // Build $match stage
        let matchStage = {
            $match: { 
                timestamp: { $gte: startDate },
            } 
        };

        // Only add medium condition if medium is not 'All'
        if (medium !== 'All') {
            matchStage.$match.medium = medium;
        }

        // Seperate leaderboards from testing server data
        let testGuildExcludeMatch;
        if (guildId === testingServerId) {
            testGuildExcludeMatch = { $match: { guildId: testingServerId} }
        } else {
            testGuildExcludeMatch = { $match: { guildId: { $ne: testingServerId } } }
        };

        const topUsers = await Log.aggregate([
            testGuildExcludeMatch,
            matchStage,
            { $group: { _id: "$userId", totalPoints: { $sum: "$points" } } },
            { $sort: { totalPoints: -1 } },
            { $limit: 10 }
        ]);
        

        const topFiveNamesAndPoints = await Promise.all(topUsers.map(async user => {
            let discordUser = await interaction.client.users.fetch(user._id);
            return {
                username: discordUser.username,
                totalPoints: user.totalPoints
            };
        }));
        

        // Make embed for log message
        const leaderboardEmbed = new EmbedBuilder()
        .setColor('#c3e0e8')
        .setTitle(`${timePeriod} ${medium} Immersion Leaderboard`)
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setThumbnail('https://media.giphy.com/media/vNY0UZX11LcNW/giphy.gif')
        .setTimestamp()
        .addFields(
            topFiveNamesAndPoints.map((user, index) => ({
                name: `${index + 1}. ${user.username}`,
                value: `\`${user.totalPoints} points\``
            }))
        )
        // Send embed
        await interaction.reply({ embeds: [leaderboardEmbed] });
    },
};
