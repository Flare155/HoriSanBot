const { DateTime } = require('luxon');
const Timeout = require('../models/Timeout'); // Adjust the path as necessary

async function checkTimeouts(client) {
    const now = DateTime.utc();
    
    // Find timeouts that are due and haven't been executed the required number of times
    const dueTimeouts = await Timeout.find({
        activationTime: { $lte: now.toJSDate() },
        repeatCount: { $gte: 0 },
    });
    
    for (const timeout of dueTimeouts) {
        try {
            const guild = client.guilds.cache.get(timeout.guildId);
            if (!guild) {
                console.error(`Guild ${timeout.guildId} not found.`);
                continue;
            }
            
            const member = await guild.members.fetch(timeout.userId);
            if (!member) {
                console.error(`Member ${timeout.userId} not found in guild ${timeout.guildId}.`);
                continue;
            }
            
            // Execute the timeout
            const timeoutDurationMs = timeout.timeoutDuration * 1000; // Convert to milliseconds
            await member.timeout(timeoutDurationMs, 'Scheduled SelfTimeout');

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
            console.error(`Error executing timeout for user ${timeout.userId}:`, error);
        }
    }
}

module.exports = { checkTimeouts };
