const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('selfTimeout')
		.setDescription('Use to time yourself out!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};