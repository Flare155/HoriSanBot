const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time,} = require('discord.js');
const Timer = require('../../models/Timer');
const User = require('../../models/User');
const { DateTime } = require("luxon");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timer_dev')
		.setDescription('Start or stop a timer for your immersion!')
		.addStringOption(option =>
            option.setName('timer')
                .setDescription('What do you want to do with the timer')
                .setRequired(true)
                .addChoices(
                    { name: 'Start', value: 'Start' },
                    { name: 'Status', value: 'Status' },
                    { name: 'Stop', value: 'Stop' },
        )),
	async execute(interaction) {

		if(Timer.userId == null) {
			await Timer.create({ userId: interaction.user.id });
		}

		// Variable initialization
		const choice = interaction.options.getString('timer');
		const user = await Timer.findOne({ userId: interaction.user.id });
		const currentTime = DateTime.now().toUTC();
		const dbTime = await Timer.findOne({timerTime: user.timerTime});

		// Caulate the time the user has immersed for
		let immersionTime = (((currentTime - dbTime.timerTime) / 1000) / 60);

		// Checks if user exists - if not, return
        if (!user) {
            return 0; 
        }

		// Checks the choice made by the user
		if(choice == "Start") {
			if(dbTime.timerTime != 0) {
				return interaction.reply("There is timer already running, please stop it to start a new timer.");
			}
 
			// Update the start time for the timer in the database
			await Timer.updateOne({timerTime: currentTime});

			await interaction.reply(`Your time has started at: ${currentTime.toFormat("HH:mm:ss")}!`);
		} else if(choice == "Status") {
			if(dbTime.timerTime == 0) {
				return interaction.reply("You have not started a timer yet, please use Start option to start a timer.");
			}

			await interaction.reply(`You have been immersing for ${immersionTime.toFixed(2)} minutes!`);
		} else if(choice == "Stop") {
			if(dbTime.timerTime == 0) {
				return interaction.reply("You have not started a timer yet, please use Start option to start a timer.");
			}

			await interaction.reply(`You have immersed for ${immersionTime.toFixed(2)} minutes!`);

			await Timer.updateOne({timerTime: 0});
		}
	}
}