const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    timerStart: {type: Date, required: true, default: null}
});


const Timer = mongoose.models.Timer || mongoose.model('Timer', userSchema);
module.exports = Timer;
