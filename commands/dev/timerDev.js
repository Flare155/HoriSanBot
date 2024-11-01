const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time,} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timer_dev')
		.setDescription('Start or stop a timer for your immersion!'),
	async execute(interaction) {
		await interaction.deferReply();

		let startTime = new Date().getTime();
		let stoppedTime = 0;
		let immersedTime = 0;

		// Button for finishing the immersion
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()	
				.setCustomId('finish_immersion')
				.setLabel('Finish Immersion')
				.setStyle(ButtonStyle.Danger),
		);

		const embed = new EmbedBuilder()
                .setTitle('Immersion Timer')
                .setThumbnail(
                    interaction.user.displayAvatarURL({ dynamic: true })
                )
                .addFields(
                    { name: 'Timer Has Started!', value: "Click the buttom to stop the timer." },

        );

		await interaction.editReply({
			embeds: [embed],
			components: [row],
		});

		// Create a collector to handle button interactions
		const filter = (i) => i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({filter, time: 2147483647});

		collector.on('collect', async (i) => {
			if (i.customId === 'finish_immersion') {
				// User finished the immersion time
				stoppedTime = new Date().getTime();

				immersedTime = (((stoppedTime - startTime) / 1000) / 60).toFixed(2);

				await i.update({
					content: `You have immersed ${immersedTime} minutes!`,
					components: [],
					embeds: [],
				});
			}
			collector.stop();
		});
	},
};