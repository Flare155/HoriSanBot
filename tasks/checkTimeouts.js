const { DateTime } = require('luxon');
const Timeout = require('../models/Timeout'); // Adjust the path as necessary

async function checkTimeouts(client) {
    const now = DateTime.utc();
    
    // Find timeouts that are due and have repeats remaining
    const dueTimeouts = await Timeout.find({
        activationTime: { $lte: now.toJSDate() },
        repeatCount: { $gte: 0 },
    });

    for (const timeout of dueTimeouts) {
        try {
            // Validate activationTime
            if (!timeout.activationTime) {
                console.error(`Invalid activation time for timeout ID ${timeout._id}`);
                continue;
            }

            // Fetch the guild
            const guild = client.guilds.cache.get(timeout.guildId) || await client.guilds.fetch(timeout.guildId);
            if (!guild) {
                console.error(`Guild ${timeout.guildId} not found.`);
                continue;
            }

            // Fetch the member
            const member = await guild.members.fetch(timeout.userId).catch(() => null);
            if (!member) {
                console.error(`Member ${timeout.userId} not found in guild ${timeout.guildId}.`);
                continue;
            }

            // Execute the timeout
            const timeoutDurationMs = timeout.timeoutDuration * 1000; // Convert to milliseconds
            await member.timeout(timeoutDurationMs, 'Scheduled SelfTimeout');

            console.log(`Timed out user ${timeout.userId} in guild ${timeout.guildId} for ${timeout.timeoutDuration} seconds.`);

            // Decrement the repeat count
            timeout.repeatCount -= 1;

            if (timeout.repeatCount > 0) {
                // Schedule the next activation time (e.g., next day at the same time)
                const activationDateTime = DateTime.fromJSDate(timeout.activationTime);
                const nextActivationTime = activationDateTime.plus({ days: 1 });
                timeout.activationTime = nextActivationTime.toJSDate();
                await timeout.save();
            } else {
                // Remove the timeout from the database if it has been executed the required number of times
                await Timeout.deleteOne({ _id: timeout._id });
            }
        } catch (error) {
            console.error(`Error executing timeout for user ${timeout.userId} in guild ${timeout.guildId}:`, error);

            if (error.code === 50013) {
                // Missing Permissions
                console.error("Missing permissions to timeout the user. Deleting the timeout from the database.");

                // Delete the timeout from the database since it cannot be executed
                await Timeout.deleteOne({ _id: timeout._id });
            } else {
                // Handle other errors as needed
                console.error("An unexpected error occurred while processing the timeout.");
            }
        }
    }
}

module.exports = { checkTimeouts };
