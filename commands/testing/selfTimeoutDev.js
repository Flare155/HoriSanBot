const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('selftimeout_dev')
		.setDescription('Use to time yourself out!')
		.addIntegerOption(option =>
            option.setName('unit')
                .setDescription('The unit of time you want to enter your timeout in')
                .setRequired(true)
                .addChoices(
                    { name: 'Day', value: 86400000 },
                    { name: 'Hour', value: 3600000 },
                    { name: 'Minute', value: 60000 },
                    { name: 'Second', value: 1000 },
                    ))
		.addNumberOption(option =>
            option.setName('amount')
                .setDescription('The amount of time you want to be timed out for')
                .setRequired(true)
            ),
	async execute(interaction) {
		const timeUnits = {
			86400000: 'day',
			3600000: 'hour',
			60000: 'minute',
			1000: 'second'
		};
		try {
			const unitValue = interaction.options.getInteger('unit');
			const amount = interaction.options.getNumber('amount');
			const userId = interaction.user.id;
			const member = await interaction.guild.members.fetch(userId);
			const timeoutDuration = unitValue * amount

			await member.timeout(timeoutDuration, 'SelfTimeout');
			const unitName = timeUnits[unitValue];
			await interaction.reply('You have been timed out for ' + amount + ' ' + (unitName) + 's.');

		} catch (error) {
			// If there's an error, log it and inform the user
			console.error('Error trying to timeout a member:', error);
			await interaction.reply('Failed to timeout the member.');
		}
	},
};