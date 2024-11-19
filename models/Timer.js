const mongoose = require('mongoose');

const timerSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    timerTime: {type: Number, required: true, default: 0},
});

timerSchema.index({ timerTime: 1 });

const Timer = mongoose.models.Timer || mongoose.model('Timer', timerSchema);
module.exports = Timer;
