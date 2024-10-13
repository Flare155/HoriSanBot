const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    medium: { type: String, required: true},
    unit: { type: String, required: true},
    amount: { type: Number, required: true, default: 0, min: 0 },
    points: { type: Number, required: true, default: 0, min: 0 },
    title: { type: String, required: true},
    notes: { type: String, required: false},
});

logSchema.index({ userId: 1 });
logSchema.index({ timestamp: -1 });

const Log = mongoose.model('Log', logSchema);
module.exports = Log;


"SELECT "