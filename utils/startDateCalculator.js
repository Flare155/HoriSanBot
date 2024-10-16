let now = new Date();

function startDateCalculator(timePeriod) {
    switch(timePeriod) {
        case 'All Time':
            return new Date(0); // Beginning of Unix time
        case 'Yearly':
            // For 'Yearly', we want to start from the beginning of the current year.
            // We set the month and date to their minimum values (0 for January and 1 for the first day).
            return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)); // Start of this year
        case 'Monthly':
            // For 'Monthly', we want to start from the beginning of the current month.
            // We set the date to its minimum value (1 for the first day).
            return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); // Start of this month
        case 'Weekly':
            // For 'Weekly', we want to start from the beginning of the current week.
            // We're using the getUTCDay() function, which returns the day of the week (0 for Sunday, 1 for Monday, etc.).
            // By subtracting this from the current date, we get the last Sunday.
            return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay())); // Start of this week
        case 'Today':
            // For 'Today', we just want to start from the beginning of the current day.
            return Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); // Start of today
    };
};

module.exports = { startDateCalculator };