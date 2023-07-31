const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require("../../models/User");
const Log = require("../../models/Log");
const { testingServerId } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Replies with your immersion info!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const exists = await User.exists({ userId: userId });

        let logStats = [];

        // Exclude testing server data
        let testGuildExcludeMatch;
        if (guildId === testingServerId) {
            testGuildExcludeMatch = { $match: { guildId: testingServerId} }
        } else {
            testGuildExcludeMatch = { $match: { guildId: { $ne: testingServerId } } }
        };

        // Find total points
        if (exists) {
            logStats = await Log.aggregate([
                testGuildExcludeMatch,
                { $match: { userId: userId } },  // Only consider logs for this user
                { $group: { _id: { medium: "$medium", user: "$userId" }, 
                            total: { $sum: "$amount" }, 
                            units: { $push: "$unit" } } } // Store all units in an array
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
                .setColor(0x0099FF)
                .setTitle(`${interaction.user.username}'s Profile`)
                .setThumbnail(userAvatarURL);
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
        };
    },
};
