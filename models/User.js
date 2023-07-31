const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    guildId: { type: Number, required: true },
    timestamp: {type: String, required: true },
});

userSchema.index({ userId: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;



