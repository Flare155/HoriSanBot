const { SlashCommandBuilder } = require('discord.js');
const { mongoose } = require('mongoose');
const User = require("../../models/User");
const Log = require("../../models/log");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Replies with your immersion info!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const exists = await User.exists({ userId: userId });
        let totalPoints = 0;

        if (exists) {
            totalPoints = await Log.aggregate([
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

        if (exists) {
            await interaction.reply(`You have ${totalPoints} points!`);
        } else {
            await interaction.reply('User not found :(');
        };
    },
};
