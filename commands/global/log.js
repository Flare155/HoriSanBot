const { SlashCommandBuilder } = require('discord.js');
const { sendErrorMessage } = require('../../utils/formatting/errorMessageFormatter.js');
const { saveLog } = require('../../utils/saveLog.js');
const { buildLogEmbed } = require('../../utils/buildLogEmbed.js');

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
            option.setName('notes')
                .setDescription('Optional notes')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('episode_length')
                .setDescription('The length of each episode (e.g., 45m, 1h30m, 2m5s), (default is 21m)')
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
            let count = null;
            let unit = "", unitLength = null, totalSeconds = 0;

            // Regular expressions to match time and episode formats
            const timePattern = /^(?!.*ep)(?=.*[hms])(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i; // Matches input in (Num h, Num m, Num s), excludes 'ep'
            const episodePattern = /^(?!.*[hms])(\d+)ep$/i; // Matches input in (Num ep) format, excludes h, m, s

            // Calculate log information based on input
            if (!episodePattern.test(input) && !timePattern.test(input)) {
                return sendErrorMessage(interaction, "Invalid input format. Examples: `2ep`, `1h3m`. See `/help log` for more info.");
            }

            // Handle episodes logic here
            if (episodePattern.test(input)) {
                // Ensure only Anime can be logged as Episodes
                if (medium !== "Anime") {
                    return sendErrorMessage(interaction, "You can only log Anime as Episodes. See `/help log` for more info.");
                }
                // If the user enters a custom episode length
                if (customEpisodeLength) {
                    if (timePattern.test(customEpisodeLength)) {
                        // Parse episodes and totalSeconds for custom length anime log, then save data
                        count = parseEpisodes(input, episodePattern);
                        unitLength = parseTime(customEpisodeLength, timePattern);
                        totalSeconds = unitLength * count;
                        unit = "Episodes";
                    } else {
                        // Invalid Input Catch
                        return sendErrorMessage(interaction, "Invalid episode length format. Examples: `45m`, `1h30m`. See `/help log` for more info.");
                    }
                } else {
                    // Set log data for non-custom anime log
                    unitLength = 1260; // Default episode length: 21 minutes
                    count = parseEpisodes(input, episodePattern);
                    unit = "Episodes";
                    totalSeconds = count * 21 * 60;
                }
            } else if (timePattern.test(input)) {
                // Handle time
                if (medium === "Anime") {
                    return sendErrorMessage(interaction, "For custom anime episode lengths, use `episode_length`. See `/help log` for more info.");
                }
                count = parseTime(input, timePattern);
                unit = "Seconds";
                totalSeconds = count;
            } else {
                // Invalid Input Catch
                return sendErrorMessage(interaction, "Invalid input format. Examples: `2ep`, `1h3m`. See `/help log` for more info.");
            }

            // Error handling for invalid log amounts
            if (totalSeconds < 60) {
                return interaction.reply(`Error: The minimum log size is 1 minute, you entered ${totalSeconds} seconds.`);
            }
            if (totalSeconds > 72000) {
                return interaction.reply(`Error: The maximum log size is 1200 minutes (20 hours), you entered ${Math.round((totalSeconds * 10) / 60) / 10} minutes.`);
            }

            // customDate and isBackLog are used in backlog command
            let customDate = null;
            let isBackLog = false;

            // Save the log to the database
            const log = await saveLog(interaction, customDate, medium, title, notes, isBackLog, unit, count, unitLength, totalSeconds);
            if (!log) {
                throw new Error('An error occurred while saving the log. Check the log file');
            }

            // Send an embed message with the log details
            const logEmbed = buildLogEmbed(interaction, log);
            // Send the embed
            await interaction.reply({ embeds: [logEmbed] });

            // **Modified Code**: Check for links in the notes and send them as a plain message
            if (notes) {
                const links = extractLinks(notes);
                if (links.length > 0) {
                    await sendLinkMessage(interaction, links);
                }
            }
        } catch (error) {
            console.error('An unexpected error occurred executing log command:', error);
            return sendErrorMessage(interaction, "An unexpected error occurred executing the log command. Please try again later.");
        }
    },
};



// Utility function to send a message with the link(s)
async function sendLinkMessage(interaction, links) {
    // Combine all links into one message
    const linkMessage = links.join('\n > ');

    // Send the message as a follow-up to ensure it's associated with the interaction
    await interaction.followUp({ content: `> ${linkMessage}` });
}

// Utility function to extract links from a string
function extractLinks(text) {
    // Regular expression to match URLs
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    const links = text.match(urlPattern) || [];
    return links;
}

// Utility function to parse time strings
function parseTime(input, timePattern) {
    const match = input.match(timePattern);
    if (!match) return null;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return (hours * 3600) + (minutes * 60) + seconds;
}

// Utility function to parse episode input
function parseEpisodes(input, episodePattern) {
    const match = input.match(episodePattern);
    if (!match) return null;
    return parseInt(match[1], 10);
}
