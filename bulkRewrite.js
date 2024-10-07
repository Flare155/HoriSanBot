(async () => {
    try {
        console.log("Starting Conversion Process");

        // Connect to the database
        await mongoose.connect(AtlasDbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to Database");

        // Get all logs that need unit conversion
        const allLogs = await Log.find({ unit: { $in: ["Pages", "Episodes", "Chars"] } }).exec();
        console.log(`Found ${allLogs.length} logs to update.`);

        // Go through logs and calculate new values for points and unit conversion
        const updateQueries = allLogs.map((item) => {
            let newAmount = item.amount;
            let newPoints = item.points;

            switch (item.unit) {
                case "Pages":
                    // Convert pages to minutes (assuming 1 page = 0.2 minutes)
                    newAmount = item.amount * 0.2;
                    newPoints = Math.round(newAmount); // Keep the points consistent with new amount
                    break;
                case "Episodes":
                    // Convert episodes to minutes (assuming 1 episode = 20 minutes)
                    newAmount = item.amount * 20;
                    newPoints = newAmount; // 1 point per minute
                    break;
                case "Chars":
                    // Convert characters to minutes (assuming 400 characters = 1 minute)
                    newAmount = item.amount / 400;
                    newPoints = Math.round(newAmount); // Keep the points consistent with new amount
                    break;
                default:
                    break;
            }

            return {
                updateOne: {
                    filter: { _id: item._id },
                    update: { amount: newAmount, points: newPoints, unit: "Minutes" }
                }
            };
        });

        // Perform bulk update
        if (updateQueries.length > 0) {
            await Log.bulkWrite(updateQueries);
            console.log("Conversion completed successfully.");
        } else {
            console.log("No logs found for conversion.");
        }
    } catch (error) {
        console.error("Error during conversion process:", error);
    } finally {
        // Disconnect from the database
        await mongoose.disconnect();
        console.log("Disconnected from Database");
    }
})();