const { DateTime } = require('luxon');
const Log = require("../models/Log");
const User = require("../models/User");

const calculateStreak = async (userId) => {
    try {
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

        const getAdjustedDay = (timestamp) => {
            const dt = DateTime.fromJSDate(timestamp).setZone(userTimezone);
            if (dt.hour < 4) {
                // Before 4 AM, consider it as part of the previous day
                return dt.minus({ days: 1 }).startOf('day').plus({ hours: 4 });
            } else {
                // On or after 4 AM
                return dt.startOf('day').plus({ hours: 4 });
            }
        };

        const now = DateTime.now().setZone(userTimezone);
        const today = getAdjustedDay(now.toJSDate());
        const yesterday = today.minus({ days: 1 });

        // Adjust the first log's timestamp to the adjusted "day" (4 AM start)
        let mostRecentLogTime = getAdjustedDay(logs[0].timestamp);

        // Check if the most recent log is from today or yesterday
        if (mostRecentLogTime >= yesterday) {
            currentStreak = 1;
        } else {
            return 0; // If the most recent log is older than yesterday, reset streak to 0
        }

        // Loop through the remaining logs to check for consecutive "days"
        for (let i = 1; i < logs.length; i++) {
            let currentLogTime = getAdjustedDay(logs[i].timestamp);

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
