const { Events } = require('discord.js');
const { mongoose } = require('mongoose');
const { localDbUrl } = require('../config.json');
const { AtlasDbUrl } = require('../config.json');
const User = require("../models/User");
const Log = require("../models/Log");

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
    mongoose
        .connect(AtlasDbUrl)
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