// Takes a date and timezone and oututs the date in the users timezone

const localTimeConverter = (date, timezone) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  }).format(new Date(date));
};

module.exports = { localTimeConverter};
