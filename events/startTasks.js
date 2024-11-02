const { checkTimeouts } = require('../tasks/checkTimeouts.js');  // Adjust the path to your scheduler

module.exports = {
    name: 'ready',  // This will listen for the 'ready' event
    once: true,     // Run this code only once when the bot starts
    execute(client) {
        try {
            console.log(`✅ Succesfully started running all tasks`);

            // Start the timeout scheduler to check every minute
            setInterval(() => checkTimeouts(client), 60 * 1000);
        } catch (error) {
            console.error('❌ Failed to start tasks, see /HoriSanBot/events/startTasks.js', error);
        }
    },
};
