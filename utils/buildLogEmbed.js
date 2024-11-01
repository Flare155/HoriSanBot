const { footerCreator } = require('./formatting/logFooterCreator.js');
const { calculateEmbedColor } = require('./formatting/calculateEmbedColor.js');
const { EmbedBuilder } = require('discord.js');

// Utility function to create and send the embed message
function buildLogEmbed(interaction, log) {
    // Calculate title and description for embed
    const unit = log.amount.unit;
    const totalSeconds = log.amount.totalSeconds;
    const count = log.amount.count;
    const medium = log.medium;
    const notes = log.notes;
    const coefficient = log.amount.coefficient;

    // Calculate title and description for embed
    const description = unit === "Episodes"
        ? `${Math.round((coefficient * 10) / 60) / 10} minutes/episode → +${Math.round((totalSeconds * 10) / 60) / 10} points`
        : `1 point/min → +${Math.round((totalSeconds * 10) / 60) / 10} points`;
    let embedTitle = `🎉 ${interaction.member.displayName} logged ${count} ${unit} of ${medium}!`;
    if (unit !== "Episodes") {
        embedTitle = `🎉 ${interaction.member.displayName} logged ${Math.round((totalSeconds * 10) / 60) / 10} minutes of ${medium}!`;
    }


    // Calculate the embed color based on the points
    const embedColor = calculateEmbedColor(totalSeconds);
    // Create footer message
    const footer = footerCreator(interaction, totalSeconds);

    const logEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(embedTitle)
        .setDescription(description)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({ name: '📖 Title', value: log.title, inline: true })
        .setTimestamp();
    if (notes) {
        logEmbed.addFields({ name: '📝 Notes', value: log.notes, inline: true });
    }
    logEmbed.setFooter(footer);

    return logEmbed;
}

module.exports = { buildLogEmbed };