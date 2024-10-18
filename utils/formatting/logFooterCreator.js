// fix with a map

function footerCreator(interaction, points) {
    let footerText = 'Keep up the great immersion!';
    const iconURL = interaction.user.displayAvatarURL();
    points = points / 60;

    //special footers
    if (points == 1200) {
        footerText = 'are you.. ok? sane? 20hours in one day? probably just messed up your command';
    } else if (points == 1000) {
        footerText = '💯*10 Wow! You’re a true immersion master!';
    } else if (points == 727) {
        footerText = '🎵 WHEN YOU SEE IT!!';
    } else if (points == 666) {
        footerText = 'uh, Thats an ominous amount to immerse...';
    } else if (points == 420) {
        footerText = '🌿 420 blaze it! Your immersion is on fire!';
    } else if (points == 69) {
        footerText = '😏 Nice! You logged the perfect amount of immersion!';
    } else if (points == 39) {
        footerText = '🙏 (さんきゅう)! Thank you for using my bot!';
    // generic footers
    } else if (points > 200) {
        footerText = '🏆 Incredible immersion! Keep it going!';
    } else if (points > 100) {
        footerText = '🔥 Amazing effort! You\'re on fire!';
    } else if (points > 40) {
        footerText = 'Great job! Keep pushing forward!';
    }
    return { text: footerText, iconURL: iconURL };
};

module.exports = { footerCreator };
