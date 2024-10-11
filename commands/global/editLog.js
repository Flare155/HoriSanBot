const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, } = require('discord.js');
const mongoose = require('mongoose');
const Log = require('../../models/Log');

const MAX_EPISODES = 60;
const MAX_MINUTES = 1200;

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
        .addNumberOption((option) =>
            option
                .setName('amount')
                .setDescription('The new amount')
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('medium')
                .setDescription('The type of material you immersed in')
                .setRequired(false)
                .addChoices(
                    { name: 'Listening', value: 'Listening' }, // Audio
                    { name: 'Watchtime', value: 'Watchtime' }, // Audio-Visual
                    { name: 'YouTube', value: 'YouTube' },
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Readtime', value: 'Readtime' }, // Reading
                    { name: 'Visual Novel', value: 'Visual Novel' },
                    { name: 'Manga', value: 'Manga' }
                )
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
        const newAmount = interaction.options.getNumber('amount');
        const newMedium = interaction.options.getString('medium');
        const newTitle = interaction.options.getString('title');
        const newNotes = interaction.options.getString('notes');

        // Check if all optional fields are missing (null or undefined)
        if (
            newAmount === null &&
            newMedium === null &&
            newTitle === null &&
            newNotes === null
        ) {
            await interaction.editReply(
                'You must provide at least one field to update (amount, medium, title, or notes).'
            );
            return;
        }

        // Validate logId
        if (!mongoose.Types.ObjectId.isValid(logId)) {
            await interaction.editReply('Invalid log ID provided.');
            return;
        }

        try {
            // Find the log in the database
            const log = await Log.findOne({
                _id: logId,
                userId: interaction.user.id,
            });

            if (!log) {
                await interaction.editReply(`No log found with ID ${logId}`);
                return;
            }

            // Prepare the original embed
            const originalEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle(`Original Log`)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '📚 Medium', value: log.medium, inline: true },
                    { name: '📊 Amount', value: log.amount.toString(), inline: true },
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
            let updatedMedium = log.medium;
            let updatedUnit = log.unit;
            let updatedAmount = log.amount;
            let updatedTitle = log.title;
            let updatedNotes = log.notes;

            const identicalFields = [];

            // Validate newMedium
            if (newMedium) {
                if (newMedium === log.medium) {
                    identicalFields.push('medium');
                } else {
                    updatedMedium = newMedium;
                    updatedUnit = newMedium === 'Anime' ? 'Episodes' : 'Minutes';
                }
            }

            // Validate newAmount
            if (newAmount != null) {
                if (newAmount <= 0) {
                    await interaction.editReply('The amount must be a positive number.');
                    return;
                } else if (newAmount === log.amount) {
                    identicalFields.push('amount');
                } else {
                    updatedAmount = newAmount;
                }
            }

            // Validate newTitle
            if (newTitle) {
                if (newTitle.length > 100) {
                    await interaction.editReply('The title cannot exceed 100 characters.');
                    return;
                } else if (newTitle === log.title) {
                    identicalFields.push('title');
                } else {
                    updatedTitle = newTitle;
                }
            }

            // Validate newNotes
            if (newNotes) {
                if (newNotes.length > 1024) {
                    await interaction.editReply('The notes cannot exceed 1024 characters.');
                    return;
                } else if (newNotes === log.notes) {
                    identicalFields.push('notes');
                } else {
                    updatedNotes = newNotes;
                }
            }

            if (identicalFields.length === 4) {
                await interaction.editReply(
                    `All provided fields are identical to the original. No changes made.`
                );
                return;
            } else if (identicalFields.length > 0) {
                await interaction.editReply(
                    `The following fields are identical to the original and were not updated: ${identicalFields.join(
                        ', '
                    )}.`
                );
            }

            // Recalculate points
            let updatedPoints;
            if (updatedMedium === 'Anime') {
                if (updatedAmount > MAX_EPISODES) {
                    await interaction.editReply(
                        `The amount cannot exceed ${MAX_EPISODES} episodes for Anime.`
                    );
                    return;
                }
                updatedPoints = updatedAmount * 20;
            } else {
                if (updatedAmount > MAX_MINUTES) {
                    await interaction.editReply(
                        `The amount cannot exceed ${MAX_MINUTES} minutes.`
                    );
                    return;
                }
                updatedPoints = updatedAmount;
            }

            // Update the log object
            log.medium = updatedMedium;
            log.unit = updatedUnit;
            log.amount = updatedAmount;
            log.title = updatedTitle;
            log.notes = updatedNotes;
            log.points = updatedPoints;

            // Create an updated embed after the changes
            const updatedEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('Updated Log')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '📚 Medium', value: log.medium, inline: true },
                    { name: '📊 Amount', value: log.amount.toString(), inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '📖 Title', value: log.title, inline: true }
                );

            if (log.notes) {
                updatedEmbed.addFields(
                    { name: '📝 Notes', value: log.notes, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }
                );
            }

			// Create buttons for confirmation
			const row = new ActionRowBuilder()
			.addComponents(
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
            await interaction.editReply({ embeds: [originalEmbed, updatedEmbed], components: [row] });

			// Create a collector to handle button interactions
			const filter = i => i.user.id === interaction.user.id;
			const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

			collector.on('collect', async i => {
				if (i.customId === 'confirm_edit') {
					// User confirmed the edit
					await log.save();
					await i.update({ content: `✅ Log: ${log.title} has been edited successfully.`, components: [], embeds: [] });
				} else if (i.customId === 'cancel_edit') {
					// User canceled the edit
					await i.update({ content: '❌ Edit canceled. No changes were made to the log.', components: [], embeds: [] });
				}
				collector.stop();
			});

			collector.on('end', collected => {
				if (collected.size === 0) {
					interaction.editReply({ content: 'No response received. Edit canceled.', components: [], embeds: [] });
					collector.stop();
				}
			});

        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while updating the log.');
        }
    },
};
