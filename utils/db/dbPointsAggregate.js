const mongoose = require('mongoose');

const Log = require("../../models/Log");

const getPointsByDate = async(userId, days, timezone)=> {
    const endDate = new Date(); // Current date in UTC
    const startDate = new Date();
    startDate.setUTCDate(endDate.getUTCDate() - days); // Calculate the start date in UTC

    const results = await Log.aggregate([
        {
            $match: {
                userId: userId,
                timestamp: { $gte: startDate, $lt: endDate } // Use UTC dates for comparison
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: timezone } }, // Ensure to group by date in UTC
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

    return results; // This will return an array of objects with date and totalPoints
}

module.exports = { getPointsByDate };