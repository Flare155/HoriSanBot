const mongoose = require('mongoose');

const timeoutSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    guildId: { type: String, required: true },
    timeoutDuration: { type: Number, required: true },            // Store in milliseconds
    activationTime: { type: Date, required: true },               // When the timeout should start
    repeatCount: { type: Number, required: true, default: 0 },
});

timeoutSchema.index({ activationTime: 1 });  // To efficiently find timeouts ready to activate

const Timeout = mongoose.model('Timeout', timeoutSchema);
module.exports = Timeout;
