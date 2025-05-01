const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { saveLog } = require('../../utils/saveLog.js');
const Timer = require("../../models/Timer");
const User = require("../../models/User");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('starttimer')
		.setDescription('Start an immersion timer!')
		.addStringOption(option => 
			option.setName('medium')
			.setDescription('The type of material you immersed in')
                .setRequired(true)
                .addChoices(
                    { name: 'Listening', value: 'Listening' },     // Audio
                    { name: 'Watchtime', value: 'Watchtime' },     // Audio-Visual
                    { name: 'YouTube', value: 'YouTube' },
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Readtime', value: 'Readtime' },       // Reading
                    { name: 'Visual Novel', value: 'Visual Novel' },
                    { name: 'Manga', value: 'Manga' },
                    { name: 'Speaking', value: 'Speaking' },          // Output
                    { name: 'Writing', value: 'Writing' },
                )),
	async execute(interaction) {
		await interaction.deferReply();
		const user = interaction.options.getUser('user') || interaction.user;
		const userId = user.id;
        const medium = interaction.options.getString('medium');
		const exists = await Timer.exists({ userId: userId });
		const userData = await User.findOne({ userId: userId });
		const userTimezone = userData ? userData.timezone : 'UTC';

		var currectTime = DateTime.now();

		//In case the user does not exists in the timer DB, add it
		if(exists == null) {
			await Timer.create({ userId: userId });
		}

		//Update the startTimer field to the current time and update the medium in the DB
		await Timer.updateOne({ userId: userId }, {$set: { timerStart: currectTime.toJSDate()}});
		await Timer.updateOne({ userId: userId }, { medium: medium });

		const userAvatarURL = user.displayAvatarURL({ dynamic: true });

		//Create embed
		const startEmbed = new EmbedBuilder()
			.setColor('#6ae546')
			.setTitle(`${user.displayName} Has Started An Immersion Timer!`)
			.setThumbnail(userAvatarURL)
			.setImage('attachment://image.png')
			startEmbed.addFields({ name: "Start Immersing! 💪", value: `Use \`/stoptimer\` to stop!`, inline: true })
			.setFooter({ text: `Keep up the great work!  •  Displayed in ${userTimezone} time`, iconURL: userAvatarURL });

		await interaction.editReply({ embeds: [startEmbed] });
	},
};