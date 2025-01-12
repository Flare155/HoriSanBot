const Log = require("../../models/Log");
const { DateTime } = require('luxon');

const immersionByTimePeriod = async (userId, startDate, endDate, timezone) => { 
  console.log(timezone);
  let startDateLuxon, endDateLuxon;

  try {
    console.log("Attempting to parse startDate and endDate as ISO...");
    startDateLuxon = DateTime.fromJSDate(startDate);
    endDateLuxon = DateTime.fromJSDate(endDate);
    console.log("Parsed startDateLuxon:", startDateLuxon.toISO());
    console.log("Parsed endDateLuxon:", endDateLuxon.toISO());
  } catch (error) {
    console.error("Error parsing dates:", error);
    throw new Error("Invalid date format. Please use a valid ISO date string.");
  }

  // Validate the DateTime objects
  if (!startDateLuxon.isValid || !endDateLuxon.isValid) {
    console.log("Invalid Date - startDateLuxon:", startDateLuxon);
    console.log("Invalid Date - endDateLuxon:", endDateLuxon);
    throw new Error("Invalid start or end date.");
  }

  // Fetch logs in UTC date range
  const logs = await Log.find({
    userId,
    timestamp: {
      $gte: startDateLuxon.toJSDate(),
      $lte: endDateLuxon.toJSDate(),
    },
  });

  // Initialize data store
  const dataByDate = {};

  // Map mediums to categories
  const mediumToCategory = {
    Listening: 'listeningTime',
    Watchtime: 'watchTime',
    YouTube:  'watchTime',
    Anime:    'watchTime',
    Readtime: 'readingTime',
    'Visual Novel': 'readingTime',
    Manga:    'readingTime',

    // NEW: Speaking and Writing -> outputTime
    Speaking: 'outputTime',
    Writing:  'outputTime',
  };

  // Process each log entry
  logs.forEach((log) => {
    // Convert log timestamp from UTC to user's timezone
    const logDate = DateTime
      .fromJSDate(log.timestamp, { zone: 'utc' })
      .setZone(timezone)
      .toFormat('yyyy-MM-dd');

    // If this is the first time we've seen this date, initialize the record
    if (!dataByDate[logDate]) {
      dataByDate[logDate] = {
        date: logDate,
        watchTime: 0,
        listeningTime: 0,
        readingTime: 0,
        outputTime: 0, // Initialize new category
      };
    }

    // Determine which category to increment based on the log's medium
    const category = mediumToCategory[log.medium];
    if (!category) {
      // If it's an unrecognized medium, skip it
      return;
    }

    // Convert totalSeconds to minutes and add to the appropriate category
    dataByDate[logDate][category] += log.amount.totalSeconds / 60;
  });

  // Build array of every date in the requested range
  const dateArray = [];
  let currentDate = startDateLuxon.setZone(timezone).startOf('day');
  const endDateAdjusted = endDateLuxon.setZone(timezone).endOf('day');

  while (currentDate <= endDateAdjusted) {
    const dateString = currentDate.toFormat('yyyy-MM-dd');
    dateArray.push(dateString);
    currentDate = currentDate.plus({ days: 1 });
  }

  // Ensure each date in dateArray has an entry in dataByDate
  dateArray.forEach((date) => {
    if (!dataByDate[date]) {
      dataByDate[date] = {
        date,
        watchTime: 0,
        listeningTime: 0,
        readingTime: 0,
        outputTime: 0,
      };
    }
  });

  // Convert dataByDate object to a sorted array
  const data = dateArray.map((date) => dataByDate[date]);

  return data;
};

module.exports = { immersionByTimePeriod };
