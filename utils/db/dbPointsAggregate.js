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

const getPointsByDate = async (userId, days, timezone) => {
    const endDate = new Date(); // Current date in UTC
    const startDate = new Date();
    startDate.setUTCDate(endDate.getUTCDate() - days); // Calculate the start date in UTC

    // Perform the aggregation
    const aggregationResults = await Log.aggregate([
        {
            $match: {
                userId: userId,
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
                totalPoints: { $sum: "$points" } // Sum the points
            }
        },
        {
            $project: {
                date: "$_id",
                totalPoints: 1,
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
        pointsMap[item.date] = item.totalPoints;
    });

    // Merge the aggregation results with the complete date range
    const mergedResults = completeDateRange.map(date => ({
        date,
        totalPoints: pointsMap[date] || 0
    }));

    return mergedResults; // Returns an array of objects with date and totalPoints
};

module.exports = { getPointsByDate };
