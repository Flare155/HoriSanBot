const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Log = require('../../models/log');

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
                    { name: 'Custom', value: 'Custom' },
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

                        
        // Get the data from the time period
        const timePeriod = interaction.options.getString('period');
        let startDate = new Date();

        switch(timePeriod) {
            case 'All Time':
                startDate = new Date(0); // Beginning of Unix time
                break;
            case 'Yearly':
                startDate.setFullYear(startDate.getFullYear() - 1); // One year ago
                break;
            case 'Monthly':
                startDate.setMonth(startDate.getMonth() - 1); // One month ago
                break;
            case 'Weekly':
                startDate.setDate(startDate.getDate() - 7); // One week ago
                break;
            case 'Daily':
                startDate.setDate(startDate.getDate() - 1); // One day ago
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

        const topUsers = await Log.aggregate([
            matchStage,
            { $match: { timestamp: { $gte: startDate } } },
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
        .setColor(0x0099FF)
        .setTitle(`${timePeriod} ${medium} Immersion Leaderboard`)
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setThumbnail('https://media.giphy.com/media/1jgLDGD1Bn27e/giphy.gif')
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