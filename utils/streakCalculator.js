const { DateTime } = require('luxon');
const Log = require("../models/Log");
const User = require("../models/User");

const calculateStreak = async (userId, guildId) => {
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
        const today = DateTime.now().setZone(userTimezone).startOf('day').plus({ hours: 4 }); // "Start of today" is 4 AM in user's timezone
        const yesterday = today.minus({ days: 1 }); // "Start of yesterday" is also based on 4 AM

        // Convert the first log's timestamp to the adjusted "day" (4 AM start)
        let mostRecentLogTime = DateTime.fromJSDate(logs[0].timestamp).setZone(userTimezone).startOf('day').plus({ hours: 4 });

        // Check if the most recent log is from today or yesterday (with the 4 AM reset)
        if (mostRecentLogTime >= yesterday) {
            currentStreak = 1; // Start streak if most recent log is within today or yesterday's window
        } else {
            return 0; // If the most recent log is older than yesterday, reset streak to 0
        }

        // Loop through the remaining logs to check for consecutive "days"
        for (let i = 1; i < logs.length; i++) {
            let currentLogTime = DateTime.fromJSDate(logs[i].timestamp).setZone(userTimezone).startOf('day').plus({ hours: 4 });

            const daysDifference = mostRecentLogTime.diff(currentLogTime, 'days').days;

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
