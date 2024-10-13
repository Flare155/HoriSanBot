const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping_dev')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.deferReply();
		await interaction.editReply('Pong!');
	},
};