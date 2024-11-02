const { SlashCommandBuilder } = require('discord.js');
const { sendErrorMessage } = require('../../utils/formatting/errorMessageFormatter.js');
const { DateTime } = require('luxon');
const Timeout = require('../../models/Timeout');
const User = require('../../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('selftimeout')
        .setDescription('Use this command to time yourself out!')
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Enter a duration for the timeout (e.g., 45m, 1h30m, 2m5s)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('activation_time')
                .setDescription('The time you want to be timed out at (e.g., 8:30 AM, 2:20 PM) (default is now)')
                .setRequired(false)
        )
        .addNumberOption(option =>
            option.setName('repeat_count')
                .setDescription('The number of days the timeout will occur (default is 0)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const duration = interaction.options.getString('duration');
        const activationTime = interaction.options.getString('activation_time');
        const repeatCount = interaction.options.getNumber('repeat_count') || 0;
        const userId = interaction.user.id;
        const member = await interaction.guild.members.fetch(userId);
        const userData = await User.findOne({ userId: userId });
        const userTimezone = userData ? userData.timezone : null;
        const formattedCurrentTime = DateTime.now().setZone(userTimezone).toFormat('h:mm a');

        // Validate inputs
        if (repeatCount > 21) {
            return sendErrorMessage(interaction, "The maximum amount of repeats is 21 (3 weeks)")
        } else if (userTimezone == null) {
            return sendErrorMessage(interaction, "Set a timezone first with /settimezone!");
        };

        // Parse duration
        const parsedDuration = parseDuration(duration);
        if (!parsedDuration) {
            return sendErrorMessage(interaction, "Invalid duration format. Examples: 1h30m, 45m, 2m5s. See /help for more info.");
        };

        try {
            let parsedActivationTime;
            if (activationTime) {
                parsedActivationTime = parseTime(activationTime, userTimezone);
                if (!parsedActivationTime) {
                    return sendErrorMessage(interaction, "Invalid activation time format. Examples: 8:30 AM, 2:20 PM.");
                }
            } else {
                parsedActivationTime = DateTime.now().toUTC().toJSDate();
            }

            // Decide whether to schedule or execute immediately
            if (repeatCount >= 1 || activationTime) {
                const displayName = member.displayName || interaction.user.username;
                const newTimeout = new Timeout({
                    userId: userId,
                    displayName: displayName,
                    guildId: interaction.guild.id,
                    timeoutDuration: parsedDuration,
                    activationTime: parsedActivationTime,
                    repeatCount: repeatCount,
                });
                await newTimeout.save();
                await interaction.reply(`Your timeout has been scheduled for ${activationTime || formattedCurrentTime} with a duration of ${duration}.`);
            } else {
                const timeoutDurationMs = parsedDuration * 1000;
                await member.timeout(timeoutDurationMs, 'SelfTimeout');
                await interaction.reply(`You have been timed out for ${duration}.`);
            }
        } catch (error) {
            console.error('Error while processing self-timeout command:', error);
            if (error.code === 50013) {
                // Missing Permissions
                const errorMessage = "I do not have permission to time you out. Please ensure I have the 'Moderate Members' permission and that my role is higher than yours.";
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            } else {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp('An unknown error occurred, please report this.');
                } else {
                    await interaction.reply('An unknown error occurred, please report this.');
                }
            }
        }
    }
}

const parseDuration = (input) => {
    const durationPattern = /((\d+)\s*h)?\s*((\d+)\s*m)?\s*((\d+)\s*s?)?/i;
    const match = input.match(durationPattern);
    if (!match) return null;

    const hours = parseInt(match[2] || '0', 10);
    const minutes = parseInt(match[4] || '0', 10);
    const seconds = parseInt(match[6] || '0', 10);

    return (hours * 3600) + (minutes * 60) + seconds;
};

const parseTime = (input, timeZone) => {
    const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)\s*(AM|PM)?$/i;
    const match = input.match(timePattern);
    if (!match) return null;
    let [_, hourStr, minuteStr, period] = match;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (period) {
        period = period.toUpperCase();
        if (period === 'PM' && hour < 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
    }

    let activationTime = DateTime.now().setZone(timeZone).set({ hour, minute, second: 0, millisecond: 0 });

    // If the activation time has already passed today, schedule for the next day
    if (activationTime <= DateTime.now().setZone(timeZone)) {
        activationTime = activationTime.plus({ days: 1 });
        console.log("The time entered has already passed, timeout will start tomorrow.");
    }

    return activationTime.toUTC().toJSDate();
};
