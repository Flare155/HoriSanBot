const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require("../../models/User");
const Log = require("../../models/Log");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('log')
		.setDescription('Log your immersion!')
        .addStringOption(option =>
            option.setName('medium')
                .setDescription('The type of material you immersed in')
                .setRequired(true)
                .addChoices(
                    { name: 'Listening', value: 'Listening' },     // Audio
                    { name: 'Watchtime', value: 'Watchtime' },     // Audio-Visual
                    { name: 'YouTube', value: 'YouTube' },
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Readtime', value: 'Readtime' },       // Reading
                    { name: 'Visual Novel', value: 'Visual Novel' },
                    { name: 'Manga', value: 'Manga' },
                ))
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Minutes immersed or episodes watched')
                .setRequired(true)
            )
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the media')
                .setRequired(true)
            )
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Optional notes')
                .setRequired(false)
            ),

    async execute(interaction) {
        const medium = interaction.options.getString('medium');
        const amount = interaction.options.getNumber('amount');
        const title = interaction.options.getString('title');
        const notes = interaction.options.getString('notes');

        // Define units for each medium
        const mediumUnits = {
            Listening: "Minutes",
            Watchtime: "Minutes",
            YouTube: "Minutes",
            Anime: "Episodes",
            Readtime: "Minutes",
            "Visual Novel": "Minutes",
            Manga: "Minutes",
        };

        const mediumUnit = mediumUnits[medium];
        if (!mediumUnit) return interaction.reply("Error: Unable to find the medium for the log.");

        // Calculate points and description for the embed
        const points = mediumUnit === "Episodes" ? amount * 20 : amount;
        const description = mediumUnit === "Episodes" ? `20 points/episode → +${points} points` : `1 point/minute → +${points} points`;

        // Error handling for invalid amounts
        if (points <= 0) return interaction.reply("Error: The amount is too low to log.");
        if (points > 1200) return interaction.reply("Error: The maximum log size is 1200 minutes (20 hours).");

        // Save the log data to the database
        await saveLog(interaction, medium, mediumUnit, amount, points, title, notes);

        // Generate and send an embed message with the log details
        await sendLogEmbed(interaction, medium, mediumUnit, amount, description, title, notes);
    },
};

// Function to save the log to the database
async function saveLog(interaction, medium, mediumUnit, amount, points, title, notes) {
    try {
        // Check if the user exists and create a user entry if not
        const userExists = await User.exists({ userId: interaction.user.id });
        if (!userExists) {
            const newUser = new User({
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                timestamp: Date.now(),  // Use Date.now() for better timestamp handling
            });
            await newUser.save();
        }

        // Save the log entry
        const newLog = new Log({
            userId: interaction.user.id,
            guildId: interaction.guild.id,
            timestamp: Date.now(),
            medium,
            unit: mediumUnit,
            amount,
            points,
            title,
            notes,
        });
        await newLog.save();
    } catch (error) {
        console.error("Error saving log:", error);
        await interaction.reply("An error occurred while saving your log.");
    }
}

// Function to create and send the embed message
async function sendLogEmbed(interaction, medium, mediumUnit, amount, description, title, notes) {
    const logEmbed = new EmbedBuilder()
        .setColor('#5dade2')
        .setTitle(`🎉 ${interaction.user.displayName} Logged ${amount} ${mediumUnit} of ${medium}!`)
        .setDescription(description)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({ name: '📺 Title', value: title, inline: true });

    if (notes) {
        logEmbed.addFields({ name: '📝 Notes', value: notes, inline: true });
    }

    // Send the embed
    await interaction.reply({ embeds: [logEmbed] });
}
