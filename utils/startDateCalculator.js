const { DateTime } = require('luxon');

function startDateCalculator(timePeriod, userTimezone = 'UTC') {
  const now = DateTime.now().setZone(userTimezone); // Get the current time in the user's timezone
  let startDate;

  switch (timePeriod) {
    case 'All Time':
      startDate = DateTime.fromMillis(0).setZone(userTimezone); // Unix epoch start
      break;
    case 'Yearly':
      startDate = now.startOf('year'); // Start of the current year
      break;
    case 'Monthly':
      startDate = now.startOf('month'); // Start of the current month
      break;
    case 'Weekly':
      monday = now.startOf('week'); // Start of the current day
      startDate = monday.minus({days: 1})
      break;
    case 'Daily':
      startDate = now.startOf('day'); // Start of the current day
      break;
    default:
      startDate = DateTime.fromMillis(0).setZone(userTimezone); // Default to Unix epoch if unrecognized period
  }

  return startDate.toJSDate(); // Convert to native JS Date object
}

module.exports = { startDateCalculator };
