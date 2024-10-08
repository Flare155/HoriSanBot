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
        await sendLogEmbed(interaction, medium, mediumUnit, amount, description, title, notes, points);
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

// Function to calculate the embed color based on points
function calculateEmbedColor(points) {
    // Cap points at 1200 (extend the range as requested)
    const cappedPoints = Math.min(points, 1200);
    
    // Normalize the points for each color transition:
    // From white (#ffffff) → cyan (#00ffff) → dark blue (#0000ff) → black (#000000)
    if (cappedPoints <= 400) {
        // From white to cyan
        const intensity = 255 - Math.floor((cappedPoints / 400) * 255);
        return `#${intensity.toString(16).padStart(2, '0')}ffff`; // White → Cyan
    } else if (cappedPoints <= 800) {
        // From cyan to dark blue
        const intensity = Math.floor(((cappedPoints - 400) / 400) * 255);
        return `#00${(255 - intensity).toString(16).padStart(2, '0')}${(255 - intensity).toString(16).padStart(2, '0')}`; // Cyan → Dark Blue
    } else {
        // From dark blue to black
        const intensity = Math.floor(((cappedPoints - 800) / 400) * 255);
        return `#0000${(255 - intensity).toString(16).padStart(2, '0')}`; // Dark Blue → Black
    }
}

// Function to create and send the embed message
async function sendLogEmbed(interaction, medium, mediumUnit, amount, description, title, notes, points) {
    // Calculate the embed color based on the points
    const embedColor = calculateEmbedColor(points);

    const logEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`🎉 ${interaction.user.displayName} Logged ${amount} ${mediumUnit} of ${medium}!`)
        .setDescription(description)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({ name: '📖 Title', value: title, inline: true });

    if (notes) {
        logEmbed.addFields({ name: '📝 Notes', value: notes, inline: true });
    }

    logEmbed.setFooter({ text: 'Keep up the great immersion!', iconURL: interaction.user.displayAvatarURL() });

    // Send the embed
    await interaction.reply({ embeds: [logEmbed] });
}
