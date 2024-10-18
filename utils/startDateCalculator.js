// utils/startDateCalculator.js

const moment = require('moment');

function startDateCalculator(timePeriod) {
  const now = moment();

  let startDate;

  switch (timePeriod) {
    case 'All Time':
      startDate = moment(0); // Unix epoch start
      break;
    case 'Yearly':
      startDate = now.clone().startOf('year');
      break;
    case 'Monthly':
      startDate = now.clone().startOf('month');
      break;
    case 'Weekly':
      startDate = now.clone().startOf('week'); // Start of week (Sunday by default in moment)
      break;
    case 'Today':
      startDate = now.clone().startOf('day');
      break;
    default:
      startDate = moment(0); // Default to 'All Time' if unrecognized period
  }

  return startDate.toDate();
}

module.exports = { startDateCalculator };
