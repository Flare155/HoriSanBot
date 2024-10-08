const Log = require("../models/Log");
const User = require("../models/User");
const moment = require('moment-timezone');
const { testingServerId } = require('../config.json');

const calculateStreak = async (userId, guildId) => {
    try {
        // Exclude testing server data or main server data based on the guildId
        let testGuildExcludeMatch;
        if (guildId === testingServerId) {
            testGuildExcludeMatch = { guildId: testingServerId };
        } else {
            testGuildExcludeMatch = { guildId: { $ne: testingServerId } };
        }

        console.log(guildId);

        // Find the user to get their timezone
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return 0; // If user not found, return 0 streak
        }

        const userTimezone = user.timezone || 'UTC'; // Default to UTC if timezone is not set

        // Find all logs for the user, sorted by timestamp descending
        const logs = await Log.find({ userId: userId, ...testGuildExcludeMatch }).sort({ timestamp: -1 });

        if (logs.length === 0) {
            return 0; // No logs mean no streak
        }

        let currentStreak = 0;
        const today = moment.tz(userTimezone).startOf('day').add(4, 'hours'); // "Start of today" is 4 AM in user's timezone
        const yesterday = today.clone().subtract(1, 'day'); // "Start of yesterday" is also based on 4 AM

        // Convert the first log's timestamp to the adjusted "day" (4 AM start)
        let mostRecentLogTime = moment.tz(logs[0].timestamp, userTimezone).startOf('day').add(4, 'hours');

        // Check if the most recent log is from today or yesterday (with the 4 AM reset)
        if (mostRecentLogTime.isSameOrAfter(yesterday)) {
            currentStreak = 1; // Start streak if most recent log is within today or yesterday's window
        } else {
            return 0; // If the most recent log is older than yesterday, reset streak to 0
        }

        // Loop through the remaining logs to check for consecutive "days"
        for (let i = 1; i < logs.length; i++) {
            let currentLogTime = moment.tz(logs[i].timestamp, userTimezone).startOf('day').add(4, 'hours');

            const daysDifference = mostRecentLogTime.diff(currentLogTime, 'days');

            if (daysDifference === 1) {
                // Logs are on consecutive days (adjusted for 4 AM window), increment streak
                currentStreak++;
            } else if (daysDifference > 1) {
                // Non-consecutive day found, break the streak
                break;
            }

            mostRecentLogTime = currentLogTime;
        }

        return currentStreak;
    } catch (error) {
        console.error("Error calculating streak:", error);
        return 0; // Default to 0 in case of any errors
    }
};

module.exports = { calculateStreak };
