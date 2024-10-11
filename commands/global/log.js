const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require("../../models/User");
const Log = require("../../models/Log");
const { footerCreator } = require('../../utils/logFooterCreator.js');

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
                .setDescription('Minutes immersed or episodes watched (Episodes can be a decimal for non-standard length episodes)')
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
    // Cap points at 1200
    const cappedPoints = Math.min(points, 1200);

    let r, g, b;

    if (cappedPoints <= 60) {
        // Points 0 to 60: White to Cyan
        const ratio = cappedPoints / 60;
        r = Math.round(255 - (255 * ratio));
        g = 255;
        b = 255;
    } else if (cappedPoints <= 150) {
        // Points 60 to 150: Cyan to Bright Green
        const ratio = (cappedPoints - 60) / (150 - 60);
        r = 0;
        g = Math.round(255 - (55 * ratio)); // Green: 255 to 200
        b = Math.round(255 - (155 * ratio)); // Blue: 255 to 100
    } else if (cappedPoints <= 250) {
        // Points 150 to 250: Bright Green to Red
        const ratio = (cappedPoints - 150) / (250 - 150);
        r = Math.round(255 * ratio);
        g = Math.round(200 - (200 * ratio)); // Green: 200 to 0
        b = Math.round(100 - (100 * ratio)); // Blue: 100 to 0
    } else if (cappedPoints <= 400) {
        // Points 250 to 400: Red to Black
        const ratio = (cappedPoints - 250) / (400 - 250);
        r = Math.round(255 - (255 * ratio));
        g = 0;
        b = 0;
    } else {
        // Points above 400: Gold color
        r = 255;
        g = 215;
        b = 0;
    }

    // Convert RGB to hex
    const rgbToHex = (r, g, b) => {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16).padStart(2, '0');
            return hex;
        }).join('');
    }

    return rgbToHex(r, g, b);
}


// Function to create and send the embed message
async function sendLogEmbed(interaction, medium, mediumUnit, amount, description, title, notes, points) {
    
    // Calculate the embed color based on the points
    const embedColor = calculateEmbedColor(points);

    // Create footer message
    const footer = footerCreator(interaction, points);

    const logEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`🎉 ${interaction.user.username} Logged ${amount} ${mediumUnit} of ${medium}!`)
        .setDescription(description)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({ name: '📖 Title', value: title, inline: true });

    if (notes) {
        logEmbed.addFields({ name: '📝 Notes', value: notes, inline: true });
    }

    logEmbed.setFooter(footer);

    // Send the embed
    await interaction.reply({ embeds: [logEmbed] });
}
