const mongoose = require('mongoose');

const timeoutSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    guildId: { type: String, required: true },
    timeoutDuration: { type: Number, required: true },
    activationTime: { type: Date, required: true },
    repeatCount: { type: Number, required: true, default: 0 },
});

timeoutSchema.index({ activationTime: 1 });

const Timeout = mongoose.models.Timeout || mongoose.model('Timeout', timeoutSchema);
module.exports = Timeout;
