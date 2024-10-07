const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    guildId: { type: Number, required: true },
    timestamp: {type: String, required: true },
    streak: {type: Number, required: true, default: 0, min: 0 },
    streak: {type: Number, required: true, default: 0, min: 0 },
    timezone: { type: String, required: true, default: 'UTC' },
});

userSchema.index({ userId: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;



