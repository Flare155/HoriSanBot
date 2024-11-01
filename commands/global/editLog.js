const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const mongoose = require('mongoose');
const Log = require('../../models/Log');

const MAX_EPISODES = 57;
const MAX_MINUTES = 1200;

// Utility function to send error messages
async function sendErrorMessage(interaction, message) {
    await interaction.editReply(`❌ \`${message}\``);
}

// Utility function to parse time strings
const parseTime = (input) => {
    const timePattern = /^(?!.*ep)(?=.*[hms])(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;
    const match = input.match(timePattern);
    if (!match) return null;
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);
    return hours * 3600 + minutes * 60 + seconds;
};

// Utility function to parse episode input
const parseEpisodes = (input) => {
    const episodePattern = /^(?!.*[hms])(\d+)ep$/;
    const match = input.match(episodePattern);
    if (!match) return null;
    return parseInt(match[1], 10);
};

// Function to construct input string from amount object
function constructInputString(amount) {
    if (amount.unit === 'Seconds') {
        let totalSeconds = amount.count;
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;
        let parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);
        return parts.join('') || '0s';
    } else if (amount.unit === 'Episodes') {
        return `${amount.count}ep`;
    } else {
        return '';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editlog')
        .setDescription('Edits a specific log by its ID.')
        .addStringOption((option) =>
            option
                .setName('log_id')
                .setDescription('The ID of the log to edit')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('amount')
                .setDescription('The new amount (e.g., 1h30m, 2ep)')
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('title')
                .setDescription('The new title')
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('notes')
                .setDescription('The new notes')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        // Get the values from the user's input
        const logId = interaction.options.getString('log_id');
        const newInput = interaction.options.getString('amount');
        const newTitle = interaction.options.getString('title');
        const newNotes = interaction.options.getString('notes');

        // Check if all optional fields are missing (null or undefined)
        if (
            newInput === null &&
            newTitle === null &&
            newNotes === null
        ) {
            await sendErrorMessage(
                interaction,
                'You must provide at least one field to update (amount, title, or notes).'
            );
            return;
        }

        // Validate logId
        if (!mongoose.Types.ObjectId.isValid(logId)) {
            await sendErrorMessage(interaction, 'Invalid log ID provided.');
            return;
        }

        try {
            // Find the log in the database
            const log = await Log.findOne({
                _id: logId,
                userId: interaction.user.id,
            });

            if (!log) {
                await sendErrorMessage(interaction, `No log found with ID \`${logId}\`.`);
                return;
            }

            // Prepare the original embed
            const originalEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle(`Original Log`)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '📚 Medium', value: log.medium, inline: true },
                    { name: '📊 Amount', value: constructInputString(log.amount), inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '📖 Title', value: log.title, inline: true }
                );

            if (log.notes) {
                originalEmbed.addFields(
                    { name: '📝 Notes', value: log.notes, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }
                );
            }

            // Collect all new values
            let updatedInput = constructInputString(log.amount);
            let updatedTitle = log.title;
            let updatedNotes = log.notes;
            let updatedAmount = { ...log.amount };

            const identicalFields = [];

            // Function to recalculate amount
            const recalculateAmount = (medium, input) => {
                let amount = {
                    unit: '',
                    count: 0,
                    coefficient: undefined,
                    totalSeconds: 0
                };

                const time = parseTime(input);
                const episodesCount = parseEpisodes(input);

                if (medium === 'Anime') {
                    if (episodesCount !== null) {
                        if (episodesCount > MAX_EPISODES) {
                            throw new Error(
                                `The amount cannot exceed ${MAX_EPISODES} episodes for Anime.`
                            );
                        }
                        amount.unit = 'Episodes';
                        amount.count = episodesCount;
                        // If coefficient is already set, use it; otherwise, default to 1260 seconds (21 minutes) for anime
                        if (log.amount && log.amount.coefficient) {
                            amount.coefficient = log.amount.coefficient;
                        } else {
                            amount.coefficient = 1260; // 21 minutes in seconds
                        }
                        amount.totalSeconds = amount.count * amount.coefficient;
                    } else {
                        throw new Error(
                            'For the Anime medium, the amount must be in the format of episodes (e.g., 2ep).'
                        );
                    }
                } else {
                    if (episodesCount !== null) {
                        throw new Error(
                            `The amount for ${medium} must be time-based (e.g., 1h30m).`
                        );
                    }
                    if (time !== null) {
                        if (time > MAX_MINUTES * 60) {
                            throw new Error(
                                `The amount cannot exceed ${MAX_MINUTES} minutes.`
                            );
                        }
                        amount.unit = 'Seconds';
                        amount.count = time; // count is total seconds
                        amount.totalSeconds = time;
                    } else {
                        throw new Error(
                            'Invalid amount format. Examples: 2ep, 1h30m, 45m, 2m5s.'
                        );
                    }
                }

                return amount;
            };

            // Validate and update input
            if (newInput) {
                const existingInput = constructInputString(log.amount);
                if (newInput === existingInput) {
                    identicalFields.push('amount');
                } else {
                    try {
                        const amount = recalculateAmount(log.medium, newInput);
                        updatedInput = newInput;
                        updatedAmount = amount;
                    } catch (err) {
                        await sendErrorMessage(interaction, `Error: ${err.message}`);
                        return;
                    }
                }
            }

            // Validate and update title
            if (newTitle) {
                if (newTitle.length > 100) {
                    await sendErrorMessage(
                        interaction,
                        'The title cannot exceed 100 characters.'
                    );
                    return;
                } else if (newTitle === log.title) {
                    identicalFields.push('title');
                } else {
                    updatedTitle = newTitle;
                }
            }

            // Validate and update notes
            if (newNotes) {
                if (newNotes.length > 1024) {
                    await sendErrorMessage(
                        interaction,
                        'The notes cannot exceed 1024 characters.'
                    );
                    return;
                } else if (newNotes === log.notes) {
                    identicalFields.push('notes');
                } else {
                    updatedNotes = newNotes;
                }
            }

            if (identicalFields.length === 3) { // Only input, title, notes are tracked
                await sendErrorMessage(
                    interaction,
                    'All provided fields are identical to the original. No changes made.'
                );
                return;
            } else if (identicalFields.length > 0) {
                const fieldsList = identicalFields.map(field => `\`${field}\``).join(', ');
                await interaction.followUp(
                    `⚠️ The following fields are identical to the original and were not updated: ${fieldsList}.`
                );
            }

            // Update the log object with new values
            log.title = updatedTitle;
            log.notes = updatedNotes;
            log.amount = updatedAmount;

            // Create an updated embed after the changes
            const updatedEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('Updated Log')
                .setThumbnail(
                    interaction.user.displayAvatarURL({ dynamic: true })
                )
                .addFields(
                    { name: '📚 Medium', value: log.medium, inline: true },
                    { name: '📊 Amount', value: constructInputString(updatedAmount), inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '📖 Title', value: updatedTitle, inline: true }
                );

            if (updatedNotes) {
                updatedEmbed.addFields(
                    { name: '📝 Notes', value: updatedNotes, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }
                );
            }

            // Create buttons for confirmation
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_edit')
                    .setLabel('Confirm Changes')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel_edit')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

            // Send both embeds in one message
            await interaction.editReply({
                embeds: [originalEmbed, updatedEmbed],
                components: [row],
            });

            // Create a collector to handle button interactions
            const filter = (i) => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 15000,
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'confirm_edit') {
                    // User confirmed the edit
                    await log.save();
                    await i.update({
                        content: `✅ Log: **${log.title}** has been edited successfully.`,
                        components: [],
                        embeds: [],
                    });
                } else if (i.customId === 'cancel_edit') {
                    // User canceled the edit
                    await i.update({
                        content:
                            '❌ Edit canceled. No changes were made to the log.',
                        components: [],
                        embeds: [],
                    });
                }
                collector.stop();
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    await interaction.editReply({
                        content: '⌛ No response received. Edit canceled.',
                        components: [],
                        embeds: [],
                    });
                }
            });
        } catch (error) {
            console.error(error);
            await sendErrorMessage(interaction, 'An error occurred while updating the log.');
        }
    },
};
