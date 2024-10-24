const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { footerCreator } = require('../../utils/formatting/logFooterCreator.js');
const { calculateEmbedColor } = require('../../utils/formatting/calculateEmbedColor.js');
const { sendErrorMessage} = require('../../utils/formatting/errorMessageFormatter.js');
const { saveLog } = require('../../utils/saveLog.js');

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
                    { name: 'Readtime', value: 'Readtime' },       //    Reading
                    { name: 'Visual Novel', value: 'Visual Novel' },
                    { name: 'Manga', value: 'Manga' },
                ))
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('Enter a time (e.g., 45m 1h30m, 2m5s) or number of episodes (e.g., 10ep)')
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
            )
        .addStringOption(option =>
            option.setName('episode_length')
                .setDescription('The length of each episode (e.g., 45m 1h30m, 2m5s)')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            // Retrieve the inputs and set variables
            const medium = interaction.options.getString('medium');
            const input = interaction.options.getString('amount');
            const title = interaction.options.getString('title');
            const notes = interaction.options.getString('notes');
            const customEpisodeLength = interaction.options.getString('episode_length');
            let unit = "", unitLength = null, totalSeconds = 0;

            // Regular expression to match time and episode formats
            const timePattern = /^(?!.*ep)(?=.*[hms])(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/; // Matches input in ( Num h, Num m, Num s) excludes ep
            const episodePattern = /^(?!.*[hms])(\d+)ep$/; // Matches input in ( Num ep ) format, excludes hms


            // Calculate log information based on input
            if (!episodePattern.test(input) && !timePattern.test(input)) {
                return sendErrorMessage(interaction, "Invalid input format. Examples: |2ep|, |1h3m|. See /help log for more info.");
            }

            // Handle episodes logic here
            if (episodePattern.test(input)) {
                // Ensure only Anime can be logged as Episodes
                if (medium !== "Anime") {
                    return sendErrorMessage(interaction, "You can only log Anime as Episodes, do /help log for more info.");
                };
                // If the user enters a custom episode length
                if (customEpisodeLength) {
                    if (timePattern.test(customEpisodeLength)) {
                        // Parse episodes and totalSeconds for custom length animse log, then save data
                        count = parseEpisodes(input, episodePattern);
                        unitLength = parseTime(customEpisodeLength, timePattern);
                        console.log(unitLength);
                        totalSeconds = unitLength * count;
                        unit = "Episodes"
                    } else {
                        // Invalid Input Catch
                        return sendErrorMessage(interaction, "Invalid input format. Examples: |2ep|, |1h3m|. See /help log for more info.");
                    }
                } else {
                    // Set log data for non custom anime log
                    unitLength = 1260;
                    count = parseEpisodes(input, episodePattern);
                    unit = "Episodes"
                    totalSeconds = count * 21 * 60;
                };
            } else if (timePattern.test(input)) {
                // Handle time
                if (medium === "Anime") {
                    return sendErrorMessage(interaction, "For custom anime episode lengths, use episodeLength. See /help log for more info.");
                };
                count = parseTime(input, timePattern)
                unit = "Seconds";
                totalSeconds = count;
            } else {
                // Invalid Input Catch
                return sendErrorMessage(interaction, "Invalid input format. Examples: |2ep|, |1h3m|. See /help log for more info.");
            }

            // Error handling for invalid log amounts
            if (totalSeconds <= 60) return interaction.reply(`Error: The minimum log size is 1 minute, you entered ${totalSeconds} seconds`);
            if (totalSeconds > 72000) return interaction.reply(`Error: The maximum log size is 1200 minutes (20 hours), you entered ${Math.round((totalSeconds * 10) / 60) / 10} Minutes.`);

            // Calculate title and description for embed
            const description = unit === "Episodes" ? `${Math.round((unitLength * 10) / 60) / 10} minutes/episode → +${Math.round((totalSeconds * 10) / 60) / 10} points` : `1 point/min → +${Math.round((totalSeconds * 10) / 60) / 10} points`;
            if (unit !== "Episodes") {
                embedTitle = `🎉 ${interaction.user.displayName} Logged ${Math.round((totalSeconds * 10) / 60) / 10} Minutes of ${medium}!`;
            } else {
                embedTitle = `🎉 ${interaction.user.displayName} Logged ${count} ${unit} of ${medium}!`;
            };

            // customDate and isBackLog are used in backlog command
            customDate = null;
            isBackLog = false;
            // Save the log to the database
            await saveLog(interaction, customDate, medium, title, notes, isBackLog, unit, count, unitLength, totalSeconds);
            // Send an embed message with the log details
            await sendLogEmbed(interaction, embedTitle, description, totalSeconds, title, notes);
        } catch (error) {
            console.log(error);
            return sendErrorMessage(interaction, "An unexpected error occurred executing log command. Please try again later.")
        }    
    },
};


// Utility function to create and send the embed message
async function sendLogEmbed(interaction, embedTitle, description, totalSeconds, title, notes) {
    // Calculate the embed color based on the points
    const embedColor = calculateEmbedColor(totalSeconds);
    // Create footer message
    const footer = footerCreator(interaction, totalSeconds);

    const logEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(embedTitle)
        .setDescription(description)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({ name: '📖 Title', value: title, inline: true })
        .setTimestamp();
    if (notes) {
        logEmbed.addFields({ name: '📝 Notes', value: notes, inline: true });
    }
    logEmbed.setFooter(footer);

    // Send the embed
    await interaction.reply({ embeds: [logEmbed] });
}

// Utility function to parse time strings
const parseTime = (input, timePattern) => {
    const match = input.match(timePattern);
    if (!match) return null;
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const totalSeconds = parseInt(match[3] || 0, 10);
    return (hours * 3600) + (minutes * 60) + totalSeconds;
};

// Utility function to parse episode input
const parseEpisodes = (input, episodePattern) => {
    const match = input.match(episodePattern);
    if (!match) return null;
    return parseInt(match[1], 10);
};s