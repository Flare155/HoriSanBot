const { mongoose } = require('mongoose');
const { AtlasDbUrl } = require('./config.json');
const Log = require('./models/Log');

(async () => {
    try {
        console.log("Starting Conversion Process");

        // Connect to the database
        await mongoose.connect(AtlasDbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to Database");

        // Get all logs that have medium as "Visual Novel"
        const lightNovelLogs = await Log.find({ medium: "Visual Novel" }).exec();
        console.log(`Found ${lightNovelLogs.length} logs with medium 'Visual Novel' to update.`);

        for (const log of lightNovelLogs) {
            const newAmount = log.points; // Use points as the new amount
            const newUnit = "Minutes";
            const newMedium = "Visual Novel";

            await Log.updateOne({ _id: log._id }, { amount: newAmount, unit: newUnit, medium: newMedium });
            console.log(`Updated log with ID: ${log._id}`);
        }

        console.log("Light Novel conversion completed successfully.");
    } catch (error) {
        console.error("Error during conversion process:", error);
    } finally {
        // Disconnect from the database
        await mongoose.disconnect();
        console.log("Disconnected from Database");
    }
})();