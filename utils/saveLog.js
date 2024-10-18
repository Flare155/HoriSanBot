const User = require("../models/User");
const Log = require("../models/Log");

// Function to save the log to the database
async function saveLog(interaction, customDate, medium, title, notes, isBackLog, unit, count, unitLength, totalSeconds) {
    try {
        // Validate required parameters
        if (!interaction || !interaction.user || !interaction.guild) {
            throw new Error("Invalid interaction object.");
        }
        console.log(medium, title, unit);
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

        console.log(amount);
        // Add unitLength if provided
        if (unitLength) {
            amount.unitLength = unitLength;
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


        // Check if the user exists and create a user entry if not
        const userExists = await User.exists({ userId: interaction.user.id });
        if (!userExists) {
            const newUser = new User({
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                timestamp: Date.now(),
            });
            await newUser.save();
        }
    } catch (error) {
        console.error("Error saving log:", error);
        await interaction.editReply("An error occurred while saving your log.");
    }
};

module.exports = { saveLog };