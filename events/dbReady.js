const { Events } = require('discord.js');
const { mongoose } = require('mongoose');
const DatabaseURL = process.env.MONGO_DB_URL;

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
    mongoose
        .connect(DatabaseURL)
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