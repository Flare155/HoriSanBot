const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    const serverCount = client.guilds.cache.size;

    client.user.setPresence({
      activities: [
        {
          name: 'Custom Status', // Provide a string for the name
          type: ActivityType.Custom,
          state: `/help • Active in ${serverCount} servers`,
        },
      ],
      status: 'online', // Options: 'online', 'idle', 'dnd', 'invisible'
    });

    console.log(`Status set to: /help | Active in ${serverCount} servers`);
  },
};
