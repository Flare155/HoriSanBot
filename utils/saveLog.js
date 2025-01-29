const User = require("../models/User");
const Log = require("../models/Log");

// Function to save the log to the database
async function saveLog(interaction, customDate, medium, title, notes, isBackLog, unit, count, coefficient, totalSeconds) {
    try {
        // Validate required parameters
        if (!interaction || !interaction.user || !interaction.guild) {
            throw new Error("Invalid interaction object.");
        }
        if (!medium || !title || !unit) {
            throw new Error("Missing required parameters.");
        }
    
        // Determine the log date
        const logDate = customDate ? new Date(customDate) : new Date();

        // Construct the amount object
        const amount = {
            unit,
            count,
            totalSeconds,
        };

        // Add coefficient if provided
        if (coefficient) {
            amount.coefficient = coefficient;
        }

        // Save the log entry
        const newLog = new Log({
            userId: interaction.user.id,
            guildId: interaction.guild.id,
            timestamp: logDate,
            medium,
            title,
            notes,
            isBackLog,
            amount,
        });
        await newLog.save();

        // Check if the user exists
        const existingUser = await User.findOne({ userId: interaction.user.id });
        if (!existingUser) {
            // Create a new user if they don't exist
            const newUser = new User({
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                timestamp: new Date().toISOString(),
                streak: 0,
                displayName: interaction.user.displayName,
            });
            await newUser.save();
        } else {
            // Check if the display name has changed
            if (existingUser.displayName !== interaction.user.displayName) {
                existingUser.displayName = interaction.user.displayName;
                await existingUser.save();
            }
        }

        return newLog;
    } catch (error) {
        console.error("Error saving log:", error);
        await interaction.editReply("An error occurred while saving your log.");
    }
}

module.exports = { saveLog };
