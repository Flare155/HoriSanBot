const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    try{
      const serverCount = client.guilds.cache.size;

      // Set new status
      client.user.setPresence({
        activities: [
          {
            name: 'Custom Status',
            type: ActivityType.Custom,
            state: `/help • Active in ${serverCount} servers`,
          },
        ],
        status: 'online', // Options: 'online', 'idle', 'dnd', 'invisible'
      });

      console.log(`✅ Status set to: /help | Active in ${serverCount} servers`);
      } catch (error) {
        console.error('❌ Failed to set presence:', error);
    }
  },
};
