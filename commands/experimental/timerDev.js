const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timer_dev')
		.setDescription('Start or stop a timer for your immersion!'),
	async execute(interaction) {
		await interaction.deferReply();
		await interaction.editReply('Pong!');
	},
};