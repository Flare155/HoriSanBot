const { DateTime } = require('luxon');

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
        const unitLength = logModel.amount.unitLength;
        command += ` episode_length: ${unitLength}s`;
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