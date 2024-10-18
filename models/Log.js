const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    medium: { type: String, required: true, enum: ['Listening', 'Watchtime', 'YouTube', 'Anime', 'Readtime', 'Visual Novel', 'Manga']},
    title: { type: String, required: true},
    notes: { type: String, required: false},
    isBackLog: {type: Boolean, required: true, default: false},
    amount: {
        unit: { type: String, required: true, enum: ['Seconds', 'Episodes']},
        count: { type: Number, required: true, min: 0, max: 72000 },
        unitLength: { type: Number, required: false, min: 60, max: 72000},
        totalSeconds: { type: Number, required: true, min: 0, max: 72000},
    }
});

logSchema.index({ userId: 1 });
logSchema.index({ timestamp: -1 });

const Log = mongoose.model('Log', logSchema);
module.exports = Log;