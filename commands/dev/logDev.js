const { SlashCommandBuilder } = require('discord.js');
const { sendErrorMessage } = require('../../utils/formatting/errorMessageFormatter.js');
const { saveLog } = require('../../utils/saveLog.js');
const { buildLogEmbed } = require('../../utils/buildLogEmbed.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log_dev')
        .setDescription('Log your immersion!')
        .addStringOption(option =>
            option.setName('medium')
                .setDescription('The type of material you immersed in')
                .setRequired(true)
                .addChoices(
                    { name: 'Listening', value: 'Listening' },
                    { name: 'Watchtime', value: 'Watchtime' },
                    { name: 'YouTube', value: 'YouTube' },
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Readtime', value: 'Readtime' },
                    { name: 'Visual Novel', value: 'Visual Novel' },
                    { name: 'Manga', value: 'Manga' },
                    { name: 'Speaking', value: 'Speaking' },
                    { name: 'Writing', value: 'Writing' },
                ))
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('Duration (e.g., 45m, 1h30m, 2m5s) | Episodes (e.g., 10ep, 2ep/45m for 2 episodes of 45m).')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the media')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('advanced_logging')
                .setDescription('Enter pages (e.g., 100pg) or characters (e.g., 2000char)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Optional notes')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('episode_length')
                .setDescription('The length of each episode (e.g., 45m, 1h30m, 2m5s), default is 21m')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            // Retrieve inputs and set variables
            const medium = interaction.options.getString('medium');
            const input = interaction.options.getString('amount');
            const title = interaction.options.getString('title');
            const notes = interaction.options.getString('notes');
            const customEpisodeLength = interaction.options.getString('episode_length');
            const advancedLogging = interaction.options.getString('advanced_logging');

            // Parse advanced logging if provided (pages or characters)
            let pages = null;
            let characters = null;
            if (advancedLogging) {
                try {
                    const advResult = parseAdvancedLogging(advancedLogging);
                    if (advResult.type === "pages") {
                        pages = advResult.value;
                    } else if (advResult.type === "characters") {
                        characters = advResult.value;
                    }
                } catch (error) {
                    return sendErrorMessage(interaction, error.message);
                }
            }
            
            let count = null;
            let unit = "";
            let coefficient = null;
            let totalSeconds = 0;
            const defaultEpisodeLength = 1260; // 21 minutes in seconds

            // Regular expressions to match time and episode formats
            const timePattern = /^(?!.*ep)(?=.*[hms])(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i;
            const episodePattern = /^(?!.*[hms])(\d+)ep$/i;

            // Validate the amount input
            if (!episodePattern.test(input) && !timePattern.test(input)) {
                return sendErrorMessage(interaction, "Invalid input format. Examples: `2ep`, `1h3m`. See `/help log` for more info.");
            }

            // Determine which format we're working with
            const isEpisode = episodePattern.test(input);
            const isTime = timePattern.test(input);

            if (isEpisode) {
                if (medium !== "Anime") {
                    return sendErrorMessage(interaction, "You can only log Anime as Episodes. See `/help log` for more info.");
                }
                count = parseEpisodes(input, episodePattern);
                unit = "Episodes";

                if (customEpisodeLength) {
                    if (timePattern.test(customEpisodeLength)) {
                        coefficient = parseTime(customEpisodeLength, timePattern);
                    } else {
                        return sendErrorMessage(interaction, "Invalid episode length format. Examples: `45m`, `1h30m`. See `/help log` for more info.");
                    }
                } else {
                    coefficient = defaultEpisodeLength;
                }
                totalSeconds = coefficient * count;
            } else if (isTime) {
                if (medium === "Anime") {
                    return sendErrorMessage(interaction, "For custom anime episode lengths, use `episode_length`. See `/help log` for more info.");
                }
                count = parseTime(input, timePattern);
                unit = "Seconds";
                totalSeconds = count;
            } else {
                return sendErrorMessage(interaction, "Invalid input format. Examples: `2ep`, `1h3m`. See `/help log` for more info.");
            }

            // Validate log size
            if (totalSeconds < 60) {
                return interaction.reply(`Error: The minimum log size is 1 minute, you entered ${totalSeconds} seconds.`);
            }
            if (totalSeconds > 72000) {
                return interaction.reply(`Error: The maximum log size is 1200 minutes (20 hours), you entered ${Math.round((totalSeconds * 10) / 60) / 10} minutes.`);
            }

            // customDate and isBackLog are used in backlog command
            let customDate = null;
            let isBackLog = false;

            // Save the log (pages and characters are passed as additional arguments)
            const log = await saveLog(interaction, customDate, medium, title, notes, isBackLog, unit, count, coefficient, totalSeconds, pages, characters);
            if (!log) {
                throw new Error('An error occurred while saving the log. Check the log file');
            }

            // Build and send the log embed
            const logEmbed = buildLogEmbed(interaction, log);
            await interaction.reply({ embeds: [logEmbed] });

            // Check for links in the notes and send them as a plain message
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
    const linkMessage = links.join('\n > ');
    await interaction.followUp({ content: `> ${linkMessage}` });
}

// Utility function to extract links from a string
function extractLinks(text) {
    const urlPattern = /(?:http[s]?:\/\/.)?(?:www\.)?[-a-zA-Z0-9@%._+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_+.~#?&//=]*)/gi;
    return text.match(urlPattern) || [];
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

// Utility function to parse advanced logging (pages or characters) using regex
function parseAdvancedLogging(input) {
    const regex = /^(\d+)(pg|char)$/i;
    const match = input.match(regex);
    if (!match) {
        throw new Error("Invalid advanced logging format. Use a value ending in 'pg' or 'char'.");
    }
    const value = parseInt(match[1], 10);
    const type = match[2].toLowerCase() === 'pg' ? "pages" : "characters";
    return { type, value };
}
