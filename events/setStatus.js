const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        const serverCount = client.guilds.cache.size;
        let status = { name: `/help, active in ${serverCount} servers`, type: 'CUSTOM' };

        // Set the presence with custom status
        client.user.setPresence({
            activities: [status], // Set the status
            status: 'online', // Options: 'online', 'idle', 'dnd', 'invisible'
        });

        console.log(`Status set to: /help, active in ${serverCount} servers`);
    },
};
