const moment = require('moment-timezone');
const Log = require("../../models/Log");

const immersionByTimePeriod = async (userId, startDateUTC, endDateUTC, timezone) => {
  // Convert startDateUTC and endDateUTC to moment objects in the user's timezone
  const startDateMoment = moment.tz(startDateUTC, timezone);
  const endDateMoment = moment.tz(endDateUTC, timezone);

  // Fetch logs from the database within the date range
  const logs = await Log.find({
    userId,
    timestamp: {
      $gte: startDateUTC,
      $lte: endDateUTC,
    },
  });

  // Initialize dataByDate object
  const dataByDate = {};

  // Map mediums to categories
  const mediumToCategory = {
    Listening: 'listeningTime',
    Watchtime: 'watchTime',
    Youtube: 'watchTime',
    Anime: 'watchTime',
    Readtime: 'readingTime',
    'Visual Novel': 'readingTime',
    Manga: 'readingTime',
  };

  // Process each log entry
  logs.forEach((log) => {
    // Adjust the timestamp to the user's timezone
    const logDate = moment(log.timestamp).tz(timezone).format('YYYY-MM-DD');

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
  let currentDate = startDateMoment.clone();
  while (currentDate.isBefore(endDateMoment) || currentDate.isSame(endDateMoment, 'day')) {
    const dateString = currentDate.format('YYYY-MM-DD');
    dateArray.push(dateString);
    currentDate.add(1, 'day');
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
