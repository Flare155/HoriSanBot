const Log = require("../../models/Log");


const getLogsByDate = async (userId, days, timezone) => {
    try {
        const endDate = new Date(); // Current date in UTC
        const startDate = new Date();
        startDate.setUTCDate(endDate.getUTCDate() - days); // Calculate the start date in UTC

        // Define category mappings based on 'medium'
        const categoryMappings = {
            watchTime: ['Watchtime', 'YouTube', 'Anime'],
            listeningTime: ['Listening'],
            readingTime: ['Readtime', 'Visual Novel', 'Manga']
            // Add more categories if needed
        };

        // Perform the aggregation
        const aggregationResults = await Log.aggregate([
            {
                $match: {
                    userId: userId, // Assuming userId is stored as a string
                    timestamp: { $gte: startDate, $lte: endDate } // Include endDate
                }
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$timestamp",
                                timezone: timezone
                            }
                        }
                    }, // Group by date in specified timezone
                    watchTimeSeconds: {
                        $sum: {
                            $cond: [
                                { $in: ["$medium", categoryMappings.watchTime] },
                                "$amount.totalSeconds",
                                0
                            ]
                        }
                    },
                    listeningTimeSeconds: {
                        $sum: {
                            $cond: [
                                { $in: ["$medium", categoryMappings.listeningTime] },
                                "$amount.totalSeconds",
                                0
                            ]
                        }
                    },
                    readingTimeSeconds: {
                        $sum: {
                            $cond: [
                                { $in: ["$medium", categoryMappings.readingTime] },
                                "$amount.totalSeconds",
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    date: "$_id.date",
                    watchTimeSeconds: 1,
                    listeningTimeSeconds: 1,
                    readingTimeSeconds: 1,
                    _id: 0 // Exclude _id from the output
                }
            },
            {
                $sort: { date: 1 } // Sort by date ascending
            }
        ]);

        // Generate the complete date range
        const completeDateRange = generateDateRange(startDate, endDate, timezone);

        // Create a map for quick lookup of aggregation results
        const secondsMap = {};
        aggregationResults.forEach(item => {
            secondsMap[item.date] = {
                watchTimeSeconds: item.watchTimeSeconds,
                listeningTimeSeconds: item.listeningTimeSeconds,
                readingTimeSeconds: item.readingTimeSeconds
            };
        });

        // Merge the aggregation results with the complete date range and assign relative day labels
        const mergedResults = completeDateRange.slice(0, -1).map((date, index) => { // Exclude the last date
            const relativeDay = `-${days - index}`; // -30 to -1
            const data = secondsMap[date] || { watchTimeSeconds: 0, listeningTimeSeconds: 0, readingTimeSeconds: 0 };
            return {
                date: relativeDay,
                watchTime: parseFloat((data.watchTimeSeconds / 60).toFixed(2)), // Convert seconds to minutes
                listeningTime: parseFloat((data.listeningTimeSeconds / 60).toFixed(2)),
                readingTime: parseFloat((data.readingTimeSeconds / 60).toFixed(2))
            };
        });

        // Append the current date as '0'
        const todayDateString = endDate.toLocaleDateString('en-CA', { timeZone: timezone });
        const todayData = secondsMap[todayDateString] || { watchTimeSeconds: 0, listeningTimeSeconds: 0, readingTimeSeconds: 0 };
        mergedResults.push({
            date: '0',
            watchTime: parseFloat((todayData.watchTimeSeconds / 60).toFixed(2)), // Convert seconds to minutes
            listeningTime: parseFloat((todayData.listeningTimeSeconds / 60).toFixed(2)),
            readingTime: parseFloat((todayData.readingTimeSeconds / 60).toFixed(2))
        });

        return mergedResults; // Returns an array of DataPoint objects with time in minutes
    } catch (error) {
        console.error("Error fetching logs by date:", error);
        throw error;
    }
};

module.exports = { getLogsByDate };
