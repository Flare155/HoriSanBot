const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require("../../models/User");
const Log = require("../../models/Log");
const { testingServerId } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile_dev')
        .setDescription('Replies with your immersion info!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const exists = await User.exists({ userId: userId });

        let logStats = [];
        let totalPoints = 0;

        // Exclude testing server data
        let testGuildExcludeMatch;
        if (guildId === testingServerId) {
            testGuildExcludeMatch = { $match: { guildId: testingServerId } };
        } else {
            testGuildExcludeMatch = { $match: { guildId: { $ne: testingServerId } } };
        }

        // Find total points
        if (exists) {
            // Query for total points
            const totalPointsResult = await Log.aggregate([
                testGuildExcludeMatch,
                { $match: { userId: userId } },
                { $group: { _id: null, total: { $sum: "$points" } } }
            ]);

            totalPoints = totalPointsResult.length > 0 ? totalPointsResult[0].total : 0;

            // Query for genres and their amounts
            logStats = await Log.aggregate([
                testGuildExcludeMatch,
                { $match: { userId: userId } },
                { $group: { _id: { medium: "$medium", user: "$userId" }, total: { $sum: "$amount" }, units: { $push: "$unit" } } }
            ]);
        }   

        const fieldOrder = {
            Anime: "Episodes",
            Manga: "Pages",
            Drama: "Episodes",
            YouTube: "Minutes",
            "Light Novel": "Chars",
            "Visual Novel": "Chars",
            Podcast: "Minutes",
            Reading: "Minutes",
            Listening: "Minutes"
        };

        // Reply
        if (exists) {
            // Embed response:
            const userAvatarURL = interaction.user.displayAvatarURL();
        
            // Make embed for log message
            const profileEmbed = new EmbedBuilder()
                .setColor('#c3e0e8')
                .setTitle(`${interaction.user.username}'s Profile`)
                .setThumbnail(userAvatarURL);

            // Add total points field
            profileEmbed.addFields([{ name: "Total Points", value: `${totalPoints}`, inline: false }]);
            
            // Add genre-specific fields
            let fields = [];
            for (let medium in fieldOrder) {
                let stat = logStats.find(s => s._id.medium === medium && s._id.user === userId);
                if (stat) {
                    fields.push({ name: stat._id.medium, value: `${stat.total} ${fieldOrder[medium]}`, inline: false });
                }
            }
                   
            profileEmbed.addFields(fields);
            
            // Send embed
            await interaction.reply({ embeds: [profileEmbed] });
        } else {
            await interaction.reply('User not found :(');
        }
    },
};
