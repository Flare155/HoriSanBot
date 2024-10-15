const mongoose = require('mongoose');
const Log = require("../../models/Log");

/**
 * Helper function to generate an array of dates between two dates.
 * Dates are formatted as strings in 'YYYY-MM-DD' format considering the timezone.
 * 
 * @param {Date} start - Start date (inclusive)
 * @param {Date} end - End date (inclusive)
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

    while (current <= adjustedEnd) { // Changed from < to <= to include end date
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

/**
 * Retrieves log data aggregated by relative date with multiple categorized time metrics.
 * 
 * @param {string} userId - The ID of the user
 * @param {number} days - Number of days to retrieve data for (e.g., 30 for last 30 days)
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
                    timestamp: { $gte: startDate, $lte: endDate } // Changed to $lte to include endDate
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
                    watchTime: { $cond: [{ $eq: ["$watchTime", 0] }, 0, "$watchTime"] },
                    listeningTime: { $cond: [{ $eq: ["$listeningTime", 0] }, 0, "$listeningTime"] },
                    readingTime: { $cond: [{ $eq: ["$readingTime", 0] }, 0, "$readingTime"] },
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

        // Merge the aggregation results with the complete date range and assign relative day labels
        const mergedResults = completeDateRange.slice(0, -1).map((date, index) => { // Exclude the last date
            const relativeDay = `-${days - index}`; // -30 to -1
            return {
                date: relativeDay,
                watchTime: pointsMap[date]?.watchTime !== undefined ? pointsMap[date].watchTime : 0,
                listeningTime: pointsMap[date]?.listeningTime !== undefined ? pointsMap[date].listeningTime : 0,
                readingTime: pointsMap[date]?.readingTime !== undefined ? pointsMap[date].readingTime : 0
            };
        });

        // Append the current date as '0'
        const todayDateString = endDate.toLocaleDateString('en-CA', { timeZone: timezone });
        mergedResults.push({
            date: '0',
            watchTime: pointsMap[todayDateString]?.watchTime !== undefined ? pointsMap[todayDateString].watchTime : 0,
            listeningTime: pointsMap[todayDateString]?.listeningTime !== undefined ? pointsMap[todayDateString].listeningTime : 0,
            readingTime: pointsMap[todayDateString]?.readingTime !== undefined ? pointsMap[todayDateString].readingTime : 0
        });

        return mergedResults; // Returns an array of DataPoint objects
    } catch (error) {
        console.error("Error fetching logs by date:", error);
        throw error;
    }
};

module.exports = { getLogsByDate };
