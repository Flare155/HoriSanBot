const { Events } = require('discord.js');
const { mongoose } = require('mongoose');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute() {
        mongoose
            .connect(process.env.MONGO_DB_URL)
            .then(() => {
                console.log(`✅ Database is online.`);
            })
            .catch((error) => {
                console.error('Failed to connect to the database:', error);
            });
            // User.createIndexes({ userId: 1 });
            // Log.createIndexes({ userId: 1 }, { timestamp: -1 });
    },
};