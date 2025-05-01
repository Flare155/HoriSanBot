const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { saveLog } = require('../../utils/saveLog.js');
const Timer = require("../../models/Timer");
const User = require("../../models/User");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stoptimer')
		.setDescription('Stop an immersion timer!')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the media')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Optional notes')
                .setRequired(false)
        ),
	async execute(interaction) {
		await interaction.deferReply();
		const user = interaction.options.getUser('user') || interaction.user;
		const userId = user.id;
        const title = interaction.options.getString('title');
        const notes = interaction.options.getString('notes');
        const timerData = await Timer.findOne({ userId: userId});
		const exists = await Timer.exists({ userId: userId });
        const userData = await User.findOne({ userId: userId});
        const userTimezone = userData ? userData.timezone : 'UTC';


		var currectTime = DateTime.now();

		//In case the user does not exists in the timer DB, add it
		if(exists == null) {
			await Timer.create({ userId: userId });
		}

        //Query the time from the DB and change to to a luxon DateTime to calculate the diff
		const timerStart = DateTime.fromJSDate(timerData.timerStart);

		//Calculate diff between the current time and the time in the DB
		const diff = currectTime.diff(timerStart, 'seconds',);

		let customDate = null;
        let isBackLog = false;
		let coefficient = null;
		let count = diff.seconds;
		let totalSeconds = diff.seconds;
		let unit = "Seconds";
		let medium = timerData.medium;


		//Log the immersion time
        const log = await saveLog(interaction, customDate, medium, title, notes, isBackLog, unit, count, coefficient, totalSeconds);
        if (!log) {
            throw new Error('An error occurred while saving the log. Check the log file');
        }

		//Reset the time in the DB
		await Timer.updateOne({ userId: userId }, { timerStart: null});
        await Timer.updateOne({ userId: userId }, { medium: null});

		const userAvatarURL = user.displayAvatarURL({ dynamic: true });

        //Create embed
        const stopEmbed = new EmbedBuilder()
            .setColor('#6ae546')
            .setTitle(`${user.displayName} Has Stopped An Immersion Timer!`)
            .setThumbnail(userAvatarURL)
            .setImage('attachment://image.png')
            stopEmbed.addFields({ name: "🎉 Good Job Immersing!", value: `You have immersed ${(diff.seconds * 0.0166667).toFixed(1)} minutes of ${medium}!`})
            .addFields({ name: '📖 Title', value: title, inline: true })
            .setFooter({ text: `Keep up the great work!  •  Displayed in ${userTimezone} time`, iconURL: userAvatarURL })
            .setTimestamp();

        if (notes) {
            stopEmbed.addFields({ name: '📝 Notes', value: notes, inline: true });
        }

		//Add field and calculate minutes immersed
		await interaction.editReply({ embeds: [stopEmbed] });
	},
};