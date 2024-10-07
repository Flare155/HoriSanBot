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

        // Get all logs that have medium as "Reading Min"
        const readingMinLogs = await Log.find({ medium: "Reading Min" }).exec();
        console.log(`Found ${readingMinLogs.length} logs with medium 'Reading Min' to update.`);

        // Create bulk update operations for Reading Min logs
        const readingMinUpdates = readingMinLogs.map(log => {
            const newAmount = log.points; // Use points as the new amount
            return {
                updateOne: {
                    filter: { _id: log._id },
                    update: { amount: newAmount, unit: "Minutes", medium: "Readtime" }
                }
            };
        });

        // Perform bulk update for Reading Min
        if (readingMinUpdates.length > 0) {
            await Log.bulkWrite(readingMinUpdates);
            console.log("Reading Min conversion completed successfully.");
        } else {
            console.log("No logs found for Reading Min conversion.");
        }

    } catch (error) {
        console.error("Error during conversion process:", error);
    } finally {
        // Disconnect from the database
        await mongoose.disconnect();
        console.log("Disconnected from Database");
    }
})();