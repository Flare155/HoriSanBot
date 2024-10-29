const { SlashCommandBuilder } = require('discord.js');
const { sendErrorMessage} = require('../../utils/formatting/errorMessageFormatter.js');
const { DateTime } = require('luxon');
const Timeout = require('../../models/Timeout');
const User = require("../../models/User");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('selftimeout_dev')
		.setDescription('Use to time yourself out!')
		.addStringOption(option =>
            option.setName('duration')
                .setDescription('Enter a duration for the timeout (e.g., 45m 1h30m, 2m5s)')
                .setRequired(true)
            )
		.addStringOption(option =>
			option.setName('activation_time')
				.setDescription('The time you want to be timed out at (e.g., 8:30, 14:20, 23:30) (default is now)')
				.setRequired(false)
			)
		.addNumberOption(option =>
			option.setName('repeat_count')
				.setDescription('The amount of days the timeout will occur (default is 0)')
				.setRequired(false)
			),
		
	async execute(interaction) {
		const duration = interaction.options.getString('duration');
		const activationTime = interaction.options.getString('activation_time');
		const repeatCount = interaction.options.getNumber('repeat_count') || 0;
		const userId = interaction.user.id;
		const member = await interaction.guild.members.fetch(userId);
		const userData = await User.findOne({ userId: userId});
        const userTimezone = userData ? userData.timezone : 'UTC';
		const formattedCurrentTime = DateTime.now().setZone(userTimezone).toFormat('h:mm a'); // e.g., "2:07 PM"
		
		// Parse duration
		const parsedDuration = parseDuration(duration);
		if (!parsedDuration) {
			return sendErrorMessage(interaction, "Invalid duration format. Examples: 1h3m, 45m. See /help for more info.");
		}

		try {
			let parsedDuration = parseDuration(duration);
			let parsedActivationTime;
			if (activationTime) {
				parsedActivationTime = parseTime(activationTime, userTimezone);
			} else {
				parsedActivationTime = new Date().toISOString();
			};

			// If the timeout has activation time or a repeat count save it to database
			if (repeatCount >= 1 || activationTime ) {
				console.log(interaction.user.displayName);

				// Save the log entry
				const newTimeout = new Timeout({
					userId: userId,
					displayName: interaction.user.displayName,
					guildId: interaction.guild.id,
					timeoutDuration: parsedDuration,
					activationTime: parsedActivationTime,
					repeatCount: repeatCount || 0,
				});
				await newTimeout.save();
				await interaction.reply(`Your timeout has been scheduled for ${activationTime || formattedCurrentTime } with a duration of ${parsedDuration} seconds.`);
			// If there is neither activation time nor repeat count, execute the timeout now
			} else {
				const timeoutDuration = parsedDuration * 1000; // multiply by 1000 to convert to milliseconds
				await member.timeout(timeoutDuration, 'SelfTimeout');
				await interaction.reply(`You have been timed out for ${parsedDuration} seconds`);
			}
		} catch (error) {
			// If there's an error, log it and inform the user
			console.error('Unknown error with trying to timeout a user:', error);
			await interaction.reply('An unknown error occured, sorry!, please report this.');
		}
	},
};

const parseDuration = (input) => {
	const durationPattern = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;
    const match = input.match(durationPattern);
    if (!match) return null;
    
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);
    
    return (hours * 3600) + (minutes * 60) + seconds;
};

const parseTime = (input, timeZone) => {
    const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;
    const match = input.match(timePattern);
    if (!match) return null;

    const [_, hourStr, minuteStr] = match;
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Get the current time in the user's time zone
    const now = DateTime.now().setZone(timeZone);

    // Create a DateTime object for the activation time today
    let activationTime = now.set({ hour, minute, second: 0, millisecond: 0 });

    // If the activation time has already passed today, schedule for the next day
    if (activationTime <= now) {
        activationTime = activationTime.plus({ days: 1 });
		console.log("the time entered has already passed, timeout will start tomorrow")
    }

    // Convert activation time to UTC for storage
    return activationTime.toUTC();
};
