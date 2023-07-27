const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    guildId: { type: Number, required: true },
    timestamp: {type: String, required: true },
});

userSchema.index({ userId: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;


// leaderboard needs to be able to display users in order of points, or the individual mediums anime episodes, youtube watch minutes, etc
