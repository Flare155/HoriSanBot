const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    streak: { type: Number, required: true, default: 0, min: 0 },
    longestStreak: { type: Number, required: true, default: 0, min: 0 },
    displayName: { type: String, required: true },
    // --- User Settings ---
    timezone: { type: String, required: true, default: 'UTC' },     // For displaying personal stats and data in local time.
    // mediums: { type: [String], default: [] },    // The mediums to show when using the log command.
    // notificationPreference: { type: Boolean, default: true },
    // defaultLoggingLanguage: { type: String, default: 'en' },    // The default language to tag logs with (e.g., "en" for English).
    // visibility: { type: Boolean, default: true },    // Whether the user should be visible on leaderboards.
    // dayEnd: { type: String, default: '04:00' }      // Time that the day ends for streaks and displaying on charts.
});

// Create an index on userId for faster lookups.
userSchema.index({ userId: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
