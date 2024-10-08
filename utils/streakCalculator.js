const Log = require("../models/Log");
const User = require("../models/User");
const moment = require('moment-timezone');

const calculateStreak = async (userId) => {
    try {
        // Find the user to get their timezone
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return 0; // If user not found, return 0 streak
        }

        const userTimezone = user.timezone || 'UTC'; // Default to UTC if timezone is not set

        // Find all logs for the user, sorted by timestamp descending
        const logs = await Log.find({ userId: userId }).sort({ timestamp: -1 });

        if (logs.length === 0) {
            return 0; // No logs mean no streak
        }

        let currentStreak = 0;
        const today = moment.tz(userTimezone).startOf('day').add(4, 'hours'); // "Start of today" is 4 AM in user's timezone

        // Convert the first log's timestamp to the adjusted "day" (4 AM start)
        let previousTimestamp = moment.tz(logs[0].timestamp, userTimezone).startOf('day').add(4, 'hours');

        // Check if the first log is from today (in the adjusted 4 AM timeframe)
        if (previousTimestamp.isSameOrBefore(today)) {
            currentStreak = 1; // Start streak with 1 if the most recent log is within today's window
        }

        // Loop through the remaining logs to check for consecutive "days"
        for (let i = 1; i < logs.length; i++) {
            let currentTimestamp = moment.tz(logs[i].timestamp, userTimezone).startOf('day').add(4, 'hours');

            const daysDifference = previousTimestamp.diff(currentTimestamp, 'days');

            if (daysDifference === 1) {
                // Logs are on consecutive days (adjusted for 4 AM window), increment streak
                currentStreak++;
            } else if (daysDifference > 1) {
                // Non-consecutive day found, break the streak
                break;
            }

            previousTimestamp = currentTimestamp;
        }

        return currentStreak;
    } catch (error) {
        console.error("Error calculating streak:", error);
        return 0; // Default to 0 in case of any errors
    }
};

module.exports = { calculateStreak };
