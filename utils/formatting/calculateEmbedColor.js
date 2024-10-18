// Function to calculate the embed color based on points
function calculateEmbedColor(points) {

    let r, g, b;

    if (points <= 3600) { // 0 - 3600 seconds (0 - 1 hour)
        // Points 0 to 3600: White to Cyan
        const ratio = points / 3600; // 0 to 1
        r = Math.round(255 * (1 - ratio)); // 255 to 0
        g = 255;
        b = 255;
    } else if (points <= 9000) { // 3601 - 9000 seconds (1 - 2.5 hours)
        // Points 3601 to 9000: Cyan to Bright Green
        const ratio = (points - 3600) / (9000 - 3600); // 0 to 1
        r = 0;
        g = Math.round(255 - (55 * ratio)); // 255 to 200
        b = Math.round(255 - (155 * ratio)); // 255 to 100
    } else if (points <= 15000) { // 9001 - 15000 seconds (2.5 - 4.17 hours)
        // Points 9001 to 15000: Bright Green to Red
        const ratio = (points - 9000) / (15000 - 9000); // 0 to 1
        r = Math.round(255 * ratio); // 0 to 255
        g = Math.round(200 - (200 * ratio)); // 200 to 0
        b = Math.round(100 - (100 * ratio)); // 100 to 0
    } else if (points <= 24000) { // 15001 - 24000 seconds (4.17 - 6.67 hours)
        // Points 15001 to 24000: Red to Black
        const ratio = (points - 15000) / (24000 - 15000); // 0 to 1
        r = Math.round(255 * (1 - ratio)); // 255 to 0
        g = 0;
        b = 0;
    } else {
        // Points above 24,000: Gold color
        r = 255;
        g = 215;
        b = 0;
    }

    // Convert RGB to hex
    const rgbToHex = (r, g, b) => {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16).padStart(2, '0');
            return hex;
        }).join('');
    }

    return rgbToHex(r, g, b);
}

module.exports = { calculateEmbedColor };
