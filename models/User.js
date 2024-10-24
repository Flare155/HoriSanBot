const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    timestamp: {type: Date, required: true },
    streak: {type: Number, required: true, default: 0, min: 0 },
    timezone: { type: String, required: true, default: 'UTC' },
    displayName: {type: String, required: true }
});

userSchema.index({ userId: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;