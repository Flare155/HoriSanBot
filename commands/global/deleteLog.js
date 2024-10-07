const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Log = require('../../models/Log');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('deleteLog')
		.setDescription('Deletes a specific log by its ID.')
		.addStringOption(option =>
			option.setName('log_id')
				.setDescription('The ID of the log to delete')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		try {
			// Step 1: Get the log ID from the user's input
			const logId = interaction.options.getString('log_id');
			// Step 2: Find the log in the database without deleting it
			const log = await Log.findOne({ _id: logId, userId: interaction.user.id });
			if (log) {
				// Log was found, display details and ask for confirmation
				const userAvatarURL = interaction.user.displayAvatarURL();
				const logEmbed = new EmbedBuilder()
					.setColor(0xff0000)
					.setTitle(`Confirm Deletion of ${log.amount} ${log.unit} of ${log.medium}`)
					.setDescription(`Are you sure you want to delete the following log? This action cannot be undone.`)
					.setThumbnail(userAvatarURL)
					.addFields({ name: 'Time Created', value: `<t:${Math.floor(new Date(log.timestamp).getTime() / 1000)}:F>`, inline: false })
					.addFields(
						{ name: 'Amount', value: `${log.amount} ${log.unit}`, inline: true },
						
					);
				
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
				const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

				collector.on('collect', async i => {
					if (i.customId === 'confirm_delete') {
						// User confirmed the deletion
						await Log.findByIdAndDelete(logId);
						await i.update({ content: `Log with ID ${logId} has been deleted.`, components: [] });
					} else if (i.customId === 'cancel_delete') {
						// User canceled the deletion
						await i.update({ content: 'Deletion canceled.', components: [] });
					}
				});

				collector.on('end', collected => {
					if (collected.size === 0) {
						interaction.editReply({ content: 'No response received. Deletion canceled.', components: [] });
					}
				});
			} else {
				// No log found with that ID
				await interaction.editReply(`No log found with ID ${logId}`);
			}
		} catch (error) {
			console.error(error);
			interaction.editReply('Error deleting the log');
		}
	},
};