const Log = require("../../models/Log");
const { DateTime } = require('luxon');

const immersionByTimePeriod = async (userId, startDate, endDate, timezone) => { 

  console.log(timezone);
  let startDateLuxon, endDateLuxon;

  try {
    // Log attempt to parse dates
    console.log("Attempting to parse startDate and endDate as ISO...");
    
    startDateLuxon = DateTime.fromJSDate(startDate);
    endDateLuxon = DateTime.fromJSDate(endDate);
    
    // Log the results of parsing
    console.log("Parsed startDateLuxon:", startDateLuxon.toISO());
    console.log("Parsed endDateLuxon:", endDateLuxon.toISO());
  } catch (error) {
    console.error("Error parsing dates:", error);
    throw new Error("Invalid date format. Please use a valid ISO date string.");
  }

  // Log the JS Date equivalents
  console.log("JS Date - startDateLuxon:", startDateLuxon.toJSDate());
  console.log("JS Date - endDateLuxon:", endDateLuxon.toJSDate());

  // Ensure they are valid before proceeding
  if (!startDateLuxon.isValid || !endDateLuxon.isValid) {
    console.log("Invalid Date - startDateLuxon:", startDateLuxon);
    console.log("Invalid Date - endDateLuxon:", endDateLuxon);
    throw new Error("Invalid start or end date.");
  }

  // Fetch logs from the database within the UTC date range
  const logs = await Log.find({
    userId,
    timestamp: {
      $gte: startDateLuxon.toJSDate(),
      $lte: endDateLuxon.toJSDate(),
    },
  });

  // Initialize dataByDate object
  const dataByDate = {};

  // Map mediums to categories
  const mediumToCategory = {
    Listening: 'listeningTime',
    Watchtime: 'watchTime',
    YouTube: 'watchTime',
    Anime: 'watchTime',
    Readtime: 'readingTime',
    'Visual Novel': 'readingTime',
    Manga: 'readingTime',
  };

  // Process each log entry
  logs.forEach((log) => {
    // Adjust the timestamp to the user's timezone
    const logDate = DateTime.fromJSDate(log.timestamp, { zone: 'utc' }) // from UTC
      .setZone(timezone) // convert to user's timezone
      .toFormat('yyyy-MM-dd'); // format as 'YYYY-MM-DD'

    // Initialize dataByDate[logDate] if not present
    if (!dataByDate[logDate]) {
      dataByDate[logDate] = {
        date: logDate,
        watchTime: 0,
        listeningTime: 0,
        readingTime: 0,
      };
    }

    const category = mediumToCategory[log.medium];

    if (!category) {
      // Skip if the medium is not recognized
      return;
    }

    // Sum up the time in minutes
    dataByDate[logDate][category] += log.amount.totalSeconds / 60;
  });

  // Generate an array of dates between startDate and endDate in user's timezone
  const dateArray = [];
  let currentDate = startDateLuxon.setZone(timezone).startOf('day');
  const endDateAdjusted = endDateLuxon.setZone(timezone).endOf('day');

  // Generate dates from start to end, including both bounds
  while (currentDate <= endDateAdjusted) {
    const dateString = currentDate.toFormat('yyyy-MM-dd');
    dateArray.push(dateString);
    currentDate = currentDate.plus({ days: 1 }); // move to the next day
  }

  // Ensure dataByDate has entries for each date in dateArray
  dateArray.forEach((date) => {
    if (!dataByDate[date]) {
      dataByDate[date] = {
        date,
        watchTime: 0,
        listeningTime: 0,
        readingTime: 0,
      };
    }
  });

  // Convert dataByDate object into an array sorted by date
  const data = dateArray.map((date) => dataByDate[date]);
  return data;
};

module.exports = { immersionByTimePeriod };
