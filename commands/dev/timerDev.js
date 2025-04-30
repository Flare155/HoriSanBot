const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { saveLog } = require('../../utils/saveLog.js');
const Timer = require("../../models/Timer");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timer_dev')
		.setDescription('Start or stop a timer for your immersion!')
		.addStringOption(option => 
			option.setName('timer')
			.setDescription('Choose to start or stop the timer')
			.setRequired(true)
			.addChoices(
				{ name: 'Start', value: 'Start' },
				{ name: 'Stop', value: 'Stop' },
			)),
	async execute(interaction) {
		await interaction.deferReply();
		const user = interaction.options.getUser('user') || interaction.user;
		const userId = user.id;
        const choice = interaction.options.getString('timer');
        const userData = await Timer.findOne({ userId: userId});
		const exists = await Timer.exists({ userId: userId });

		var currectTime = DateTime.now();

		//In case the user does not exists in the timer DB, add it
		if(exists == null) {
			await Timer.create({ userId: userId });
		}


		if(choice == 'Start') {
			//Update the startTimer field to the current time.
			await Timer.updateOne({ userId: userId }, {$set: { timerStart: currectTime.toJSDate()}});

			const userAvatarURL = user.displayAvatarURL({ dynamic: true });

            //Create embed
            const startEmbed = new EmbedBuilder()
                .setColor('#6ae546')
                .setTitle(`${user.displayName} Has Started An Immersion Timer!`)
                .setThumbnail(userAvatarURL)
                .setImage('attachment://image.png');

			startEmbed.addFields({ name: "Start Immersing! 💪", value: `Use \`/timer timer:stop\` to Stop!`, inline: true });

			await interaction.editReply({ embeds: [startEmbed] });
		} else if(choice == 'Stop') {
			//Query the time from the DB and change to to a luxon DateTime to calculate the diff
			const timerStart = DateTime.fromJSDate(userData.timerStart);

			//Calculate diff between the current time and the time in the DB
			const diff = currectTime.diff(timerStart, 'seconds',);

			let customDate = null;
            let isBackLog = false;
			let coefficient = null;
			let count = diff.seconds;
			let totalSeconds = diff.seconds;
			let unit = "Seconds";

			let medium = "Watchtime";
			let title = "Timer Log";
			let notes = "logged with timer";


			//Log the immersion time
            const log = await saveLog(interaction, customDate, medium, title, notes, isBackLog, unit, count, coefficient, diff.seconds);
            if (!log) {
                throw new Error('An error occurred while saving the log. Check the log file');
            }

			//Reset the time in the DB
			await Timer.updateOne({ userId: userId }, { timerStart: null});

			const userAvatarURL = user.displayAvatarURL({ dynamic: true });

            //Create embed
            const stopEmbed = new EmbedBuilder()
                .setColor('#6ae546')
                .setTitle(`${user.displayName} Has Stopped An Immersion Timer!`)
                .setThumbnail(userAvatarURL)
                .setImage('attachment://image.png');
			
			//Add field and calculate minutes immersed
			stopEmbed.addFields({ name: "Good Job Immersing! 💪", value: `You Have Immersed For ${(diff.seconds * 0.0166667).toFixed(1)} Minutes!`, inline: true });

			await interaction.editReply({ embeds: [stopEmbed] });
		}
	},
};