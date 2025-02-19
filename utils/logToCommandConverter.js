const { DateTime } = require('luxon');

// Takes a log and converts it to the slash command you would use to create that log
const logToCommandConverter = (logModel, timezone = 'utc') => {
    const todayUTC = DateTime.utc().toFormat('yyyy-MM-dd');
    const logDateWithTimezone = DateTime.fromJSDate(logModel.timestamp, { zone: timezone }).toFormat('yyyy-MM-dd');

    const isSameDay = todayUTC === logDateWithTimezone;
    let command = isSameDay ? '/log' : `/backlog  date: ${logDateWithTimezone} `;
    const unit = convertUnitToString(logModel.amount.unit);
    command += ` medium: ${logModel.medium} amount: ${logModel.amount.count}${unit} title: ${logModel.title}`;
    if (logModel.notes) {
        command += ` notes: ${logModel.notes}`;
    }
    if (logModel.medium === 'Anime') {
        const coefficient = logModel.amount.coefficient;
        command += ` episode_length: ${coefficient}s`;
    }

    return command;
};

const convertUnitToString = (unit) => {
    if (unit === 'Episodes') {
        return 'ep';
    }

    return 's';
}

module.exports = { logToCommandConverter }