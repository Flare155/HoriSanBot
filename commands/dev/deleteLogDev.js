const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Log = require('../../models/Log');
const { formatTime } = require('../../utils/formatting/formatTime.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete_log_dev')
        .setDescription('Deletes a specific log by its ID.')
        .addStringOption(option =>
            option.setName('log_id')
                .setDescription('The ID of the log to delete')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const logId = interaction.options.getString('log_id');
            const log = await Log.findOne({ _id: logId, userId: interaction.user.id });
            
            if (log) {
                // Log was found, display details and ask for confirmation
                const userAvatarURL = interaction.user.displayAvatarURL();
                const amountDescription = log.amount.unit === 'Episodes' ? `${log.amount.count} Episodes` : formatTime(log.amount.totalSeconds);

                const logEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(`Confirm Deletion of ${amountDescription} of ${log.medium}`)
                    .setDescription(`Are you sure you want to delete the following log? This action cannot be undone.`)
                    .setThumbnail(userAvatarURL)
                    .addFields({ name: 'Time Created', value: `<t:${Math.floor(new Date(log.timestamp).getTime() / 1000)}:F>`, inline: false })
                    .addFields({ name: 'Amount', value: amountDescription, inline: true });

                if (log.title) {
                    logEmbed.addFields({ name: 'Title', value: log.title, inline: true });
                }
                if (log.notes) {
                    logEmbed.addFields({ name: 'Notes', value: log.notes, inline: true });
                }

                // Create buttons for confirmation
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_delete')
                            .setLabel('Confirm')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('cancel_delete')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Secondary)
                    );

                // Send the embed with buttons
                await interaction.editReply({ embeds: [logEmbed], components: [row] });

                // Create a collector to handle button interactions
                const filter = i => i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

                collector.on('collect', async i => {
                    if (i.customId === 'confirm_delete') {
                        // User confirmed the deletion
                        await Log.findByIdAndDelete(logId);
                        await i.update({ content: `Log with ID ${logId} has been deleted.`, embeds: [], components: [] });
                    } else if (i.customId === 'cancel_delete') {
                        // User canceled the deletion
                        await i.update({ content: 'Deletion canceled.', embeds: [], components: [] });
                    }
                });

                collector.on('end', async (collected) => {
                    if (collected.size === 0) {
                        // No interaction was collected
                        await interaction.editReply({ content: 'No response received. Deletion canceled.', embeds: [], components: [] });
                    }
                });
            } else {
                // No log found with that ID
                await interaction.editReply(`No log found with ID ${logId}`);
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply('Error deleting the log');
        }
    },
};
