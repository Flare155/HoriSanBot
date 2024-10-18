// Divides totalSeconds by 60 and floors it to get the points (1 points = 60s)


function toPoints(totalSeconds) {
    return Math.floor(totalSeconds / 60);
}

module.exports = { toPoints };