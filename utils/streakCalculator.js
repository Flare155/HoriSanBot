const { DateTime } = require('luxon');
const Log = require("../models/Log");
const User = require("../models/User");

const calculateStreak = async (userId, isCurrentStreak) => {
    try {
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return 0; // If user not found, return 0 streak
        }

        const userTimezone = user.timezone || 'UTC'; // Default to UTC if timezone is not set

        // Exclude logs where isBackLog is true
        const logs = await Log.find({
            userId: userId,
            isBackLog: { $ne: true } // This ensures that isBackLog is not true
        }).sort({ timestamp: -1 });

        if (logs.length === 0) {
            return 0; // No logs mean no streak
        }

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

        // Build an array of adjusted unique days when the user logged
        const adjustedDays = logs.map(log => getAdjustedDay(log.timestamp));
        const uniqueDays = [];

        for (let i = 0; i < adjustedDays.length; i++) {
            if (i === 0 || !adjustedDays[i].hasSame(adjustedDays[i - 1], 'day')) {
                uniqueDays.push(adjustedDays[i]);
            }
        }

        // Initialize variables for longest streak calculation
        let longestStreak = 1;
        let tempStreak = 1;

        for (let i = 1; i < uniqueDays.length; i++) {
            const daysDifference = uniqueDays[i - 1].diff(uniqueDays[i], 'days').days;

            if (Math.round(daysDifference) === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }

            if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
            }
        }

        // Calculate current streak
        const now = DateTime.now().setZone(userTimezone);
        const today = getAdjustedDay(now.toJSDate());
        const yesterday = today.minus({ days: 1 });

        let currentStreak = 0;

        if (uniqueDays[0] >= yesterday) {
            currentStreak = 1;
            for (let i = 1; i < uniqueDays.length; i++) {
                const daysDifference = uniqueDays[i - 1].diff(uniqueDays[i], 'days').days;

                if (Math.round(daysDifference) === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        } else {
            currentStreak = 0;
        }

        // Decide which value to return based on isCurrentStreak
        if (isCurrentStreak) {
            return currentStreak;
        } else {
            return longestStreak;
        }
    } catch (error) {
        console.error("Error calculating streak:", error);
        return 0; // Default to 0 in case of any errors
    }
};

module.exports = { calculateStreak };
