const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { footerCreator } = require('../../utils/formatting/logFooterCreator.js');
const { calculateEmbedColor } = require('../../utils/formatting/calculateEmbedColor.js');
const { sendErrorMessage} = require('../../utils/formatting/errorMessageFormatter.js');
const { saveLog } = require('../../utils/saveLog.js');
const { DateTime } = require('luxon');
const User = require('../../models/User.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backlog')
        .setDescription('Log your immersion in the past!')
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
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('Enter a time (e.g., 45m, 1h30m, 2m5s) or number of episodes (e.g., 10ep)')
                .setRequired(true)
            )
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the media')
                .setRequired(true)
            )
        .addStringOption(option =>
            option.setName('date')
                .setDescription('The date of the log (YYYY-MM-DD)')
                .setRequired(true)
            )
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Optional notes')
                .setRequired(false)
            )
        .addStringOption(option =>
            option.setName('episode_length')
                .setDescription('The length of each episode (e.g., 45m, 1h30m, 2m5s)')
                .setRequired(false)
            ),
    async execute(interaction) {
        try { 

            // Retrieve user inputs
            const medium = interaction.options.getString('medium');
            const input = interaction.options.getString('amount');
            const title = interaction.options.getString('title');
            const notes = interaction.options.getString('notes');
            const customEpisodeLength = interaction.options.getString('episode_length');
            const dateInput = interaction.options.getString('date'); // Retrieve date input
            const userData = await User.findOne({ userId: interaction.user.id });
            const userTimezone = userData ? userData.timezone : 'UTC';

            let unit = "";
            let episodes = 0;
            let seconds = 0;
            let count = 0;
            let unitLength = undefined;
            let totalSeconds = 0;

            // Regular expressions to match time and episode formats
            const timePattern = /^(?!.*ep)(?=.*[hms])(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/; // Matches inputs like 1h30m
            const episodePattern = /^(?!.*[hms])(\d+)ep$/; // Matches inputs like 10ep

            // Parse and validate the date input
            const parsedDate = parseDate(dateInput, userTimezone);
            if (!parsedDate) {
                return sendErrorMessage(interaction, 'Invalid date format. Please use YYYY-MM-DD.');
            }

            // Add backlog restriction here
            const maxBacklogYears = 40; // Maximum time in past allowed to backlog (40 years)
            const currentDate = DateTime.now().setZone(userTimezone);
            const yearsDifference = currentDate.diff(DateTime.fromJSDate(parsedDate), 'years').years;
            if (yearsDifference > maxBacklogYears) {
                return sendErrorMessage(interaction, `You can only backlog up to ${maxBacklogYears} years in the past.`);
            }

            // Calculate log information based on input
            if (!episodePattern.test(input) && !timePattern.test(input)) {
                return sendErrorMessage(interaction, "Invalid input format. Examples: 2ep, 1h30m, 45m. See /help log for more info.");
            }

            // Handle episodes logic
            if (episodePattern.test(input)) {
                // Ensure only Anime can be logged as Episodes
                if (medium !== "Anime") {
                    return sendErrorMessage(interaction, "You can only log Anime as Episodes. See /help log for more info.");
                }

                // Parse episodes
                episodes = parseEpisodes(input);
                if (episodes === null) {
                    return sendErrorMessage(interaction, "Invalid episodes format. Example: 10ep.");
                }

                // If the user enters a custom episode length
                if (customEpisodeLength) {
                    if (timePattern.test(customEpisodeLength)) {
                        // Parse episode length
                        unitLength = parseTime(customEpisodeLength);
                        if (unitLength === null) {
                            return sendErrorMessage(interaction, "Invalid episode length format. Examples: 45m, 1h30m.");
                        }
                    } else {
                        return sendErrorMessage(interaction, "Invalid episode length format. Examples: 45m, 1h30m.");
                    }
                } else {
                    // Default episode length is 21 minutes (1260 seconds)
                    unitLength = 1260;
                }

                unit = "Episodes";
                count = episodes;
                totalSeconds = unitLength * episodes;

            } else if (timePattern.test(input)) {
                // Handle time-based logs
                if (medium === "Anime") {
                    return sendErrorMessage(interaction, "For custom anime episode lengths, use episode_length along with episodes. See /help log for more info.");
                }

                // Parse time input
                seconds = parseTime(input);
                if (seconds === null) {
                    return sendErrorMessage(interaction, "Invalid time format. Examples: 1h30m, 2m5s.");
                }

                unit = "Seconds";
                count = seconds;
                totalSeconds = seconds;

            } else {
                // This else block is redundant due to earlier validation but kept for safety
                return sendErrorMessage(interaction, "Invalid input format. Examples: 2ep, 1h30m, 45m. See /help log for more info.");
            }

            // Error handling for invalid log amounts
            if (totalSeconds < 60) {
                return sendErrorMessage(interaction, `The minimum log size is 1 minute (60 seconds). You entered ${totalSeconds} seconds.`);
            }
            if (totalSeconds > 72000) { // 1200 minutes = 72000 seconds
                return sendErrorMessage(interaction, `The maximum log size is 1200 minutes (20 hours). You entered ${Math.round((totalSeconds / 60) * 10) / 10} minutes.`);
            }

            // Calculate title and description for embed
            const description = unit === "Episodes"
                ? `${Math.round((unitLength * 10) / 60) / 10} minutes/episode → +${Math.round((totalSeconds * 10) / 60) / 10} points`
                : `1 point/min → +${Math.round((totalSeconds * 10) / 60) / 10} points`;
            let embedTitle;
            if (unit !== "Episodes") {
                embedTitle = `🎉 ${interaction.user.displayName} Logged ${Math.round((totalSeconds / 60) * 10) / 10} Minutes of ${medium}!`;
            } else {
                embedTitle = `🎉 ${interaction.user.displayName} Logged ${input} of ${medium}!`;
            }

            // Check if the log is in the future
            if (DateTime.fromJSDate(parsedDate).toMillis() > currentDate.toMillis()) {
                return sendErrorMessage(interaction, "You can't log activities for future dates.");
            }

            const isBackLog = true;
            // Save the log data to the database, including the parsed date
            await saveLog(interaction, parsedDate, medium, title, notes, isBackLog, unit, count, unitLength, totalSeconds);
            // Send an embed message with the log details
            await sendLogEmbed(interaction, embedTitle, description, medium, input, totalSeconds, title, notes, parsedDate);
        } catch (error) {
            console.log(error);
            return sendErrorMessage(interaction, "An unexpected error occurred executing log command. Please try again later.")
        }
    },
};

// Utility function to create and send the embed message
async function sendLogEmbed(interaction, embedTitle, description, medium, input, totalSeconds, title, notes, date) {
    // Calculate the embed color based on the points
    const embedColor = calculateEmbedColor(totalSeconds);
    // Create footer message
    const footer = footerCreator(interaction, totalSeconds);

    const logEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(embedTitle)
        .setDescription(description)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
            { name: '📖 Title', value: title, inline: true },
            { name: '📅 Date', value: date.toISOString().split('T')[0], inline: true }, // Display date in ISO format
            { name: '📚 Medium', value: medium, inline: true },
            { name: '📊 Input', value: input, inline: true },
        );

    if (notes) {
        logEmbed.addFields({ name: '📝 Notes', value: notes, inline: true });
    }
    logEmbed.setFooter(footer);

    // Send the embed
    await interaction.reply({ embeds: [logEmbed] });
}

// Utility function to parse time strings
const parseTime = (input) => {
    const timePattern = /^(?!.*ep)(?=.*[hms])(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;
    const match = input.match(timePattern);
    if (!match) return null;
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);
    return (hours * 3600) + (minutes * 60) + seconds;
};

// Utility function to parse episode input
const parseEpisodes = (input) => {
    const episodePattern = /^(?!.*[hms])(\d+)ep$/;
    const match = input.match(episodePattern);
    if (!match) return null;
    return parseInt(match[1], 10);
};

// Utility function to parse date strings in YYYY-MM-DD format
const parseDate = (input, userTimezone) => {
    // Regular expression to match YYYY-MM-DD
    const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = input.match(datePattern);
    if (!match) return null;
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10)
    const day = parseInt(match[3], 10);

    // Create DateTime in user's timezone at local midnight
    const dt = DateTime.fromObject(
        { year, month, day, hour: 12, minute: 0, second: 0, millisecond: 0 },
        { zone: userTimezone }
    );

    // Validate the date components using Luxon
    if (
        dt.year !== year ||
        dt.month !== month ||
        dt.day !== day
    ) {
        return null;
    }
    // Convert to UTC for storage
    const utcDt = dt.toUTC();
    return utcDt.toJSDate(); // Store this Date object in UTC
};
