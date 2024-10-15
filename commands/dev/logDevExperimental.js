const mongoose = require('mongoose');
const Log = require("../../models/Log");

/**
 * Helper function to generate an array of dates between two dates.
 * Dates are formatted as strings in 'YYYY-MM-DD' format considering the timezone.
 * 
 * @param {Date} start - Start date (inclusive)
 * @param {Date} end - End date (exclusive)
 * @param {string} timezone - Timezone string, e.g., 'UTC', 'America/New_York'
 * @returns {string[]} Array of date strings
 */
const generateDateRange = (start, end, timezone) => {
    const dates = [];
    let current = new Date(start);

    // Adjust current date to the start of the day in the specified timezone
    current = new Date(current.toLocaleString('en-US', { timeZone: timezone }));
    current.setHours(0, 0, 0, 0);

    const adjustedEnd = new Date(end.toLocaleString('en-US', { timeZone: timezone }));
    adjustedEnd.setHours(0, 0, 0, 0);

    while (current < adjustedEnd) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

/**
 * Retrieves log data aggregated by date with multiple time metrics.
 * 
 * @param {string} userId - The ID of the user
 * @param {number} days - Number of days to retrieve data for
 * @param {string} timezone - Timezone string, e.g., 'UTC', 'America/New_York'
 * @returns {Promise<DataPoint[]>} Array of DataPoint objects
 */
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
                    timestamp: { $gte: startDate, $lt: endDate } // Use UTC dates for comparison
                }
            },
            {
                $group: {
                    _id: { 
                        $dateToString: { 
                            format: "%Y-%m-%d", 
                            date: "$timestamp", 
                            timezone: timezone 
                        } 
                    }, // Group by date in specified timezone
                    watchTime: {
                        $sum: {
                            $cond: [
                                { $in: ["$medium", categoryMappings.watchTime] },
                                "$points",
                                0
                            ]
                        }
                    },
                    listeningTime: {
                        $sum: {
                            $cond: [
                                { $in: ["$medium", categoryMappings.listeningTime] },
                                "$points",
                                0
                            ]
                        }
                    },
                    readingTime: {
                        $sum: {
                            $cond: [
                                { $in: ["$medium", categoryMappings.readingTime] },
                                "$points",
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    date: "$_id",
                    watchTime: { $cond: [{ $eq: ["$watchTime", 0] }, null, "$watchTime"] },
                    listeningTime: { $cond: [{ $eq: ["$listeningTime", 0] }, null, "$listeningTime"] },
                    readingTime: { $cond: [{ $eq: ["$readingTime", 0] }, null, "$readingTime"] },
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
        const pointsMap = {};
        aggregationResults.forEach(item => {
            pointsMap[item.date] = {
                watchTime: item.watchTime,
                listeningTime: item.listeningTime,
                readingTime: item.readingTime
            };
        });

        // Merge the aggregation results with the complete date range
        const mergedResults = completeDateRange.map(date => ({
            date,
            watchTime: pointsMap[date]?.watchTime !== undefined ? pointsMap[date].watchTime : null,
            listeningTime: pointsMap[date]?.listeningTime !== undefined ? pointsMap[date].listeningTime : null,
            readingTime: pointsMap[date]?.readingTime !== undefined ? pointsMap[date].readingTime : null
        }));

        return mergedResults; // Returns an array of DataPoint objects
    } catch (error) {
        console.error("Error fetching logs by date:", error);
        throw error;
    }
};

module.exports = { getLogsByDate };
