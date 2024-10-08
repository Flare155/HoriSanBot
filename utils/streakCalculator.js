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

        let currentStreak = 1;
        let previousTimestamp = moment.tz(logs[0].timestamp, userTimezone).startOf('day'); // Start of the day for first log

        for (let i = 1; i < logs.length; i++) {
            let currentTimestamp = moment.tz(logs[i].timestamp, userTimezone).startOf('day');

            const daysDifference = previousTimestamp.diff(currentTimestamp, 'days');

            if (daysDifference === 1) {
                // Logs are on consecutive days, increment streak
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
