const User = require("../models/User");

const calculateLongestStreak = async (userId, streak) => {
    try {
        // Find user to check if a user exists
        const user = await User.findOne({ userId: userId });

        if (!user) {
            return 0; // If user not found, return 0 streak
        }

        let currectLongestStreak = 0;

        // Checks if the longest streak is smaller then the currect streak
        if(currectLongestStreak < streak) {
            currectLongestStreak = streak;
        }

        return currectLongestStreak;
    } catch (error) {
        console.error("Error calculating streak:", error);
        return 0; // Default to 0 in case of any errors
    }
}

module.exports = { calculateLongestStreak };