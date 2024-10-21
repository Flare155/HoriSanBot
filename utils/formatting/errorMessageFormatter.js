// Utility function to send error messages
async function sendErrorMessage(interaction, message) {
    try {
        // Attempt to edit the reply with an error message
        await interaction.reply({ content: `\`❌ ${message}\``, ephemeral: true });
        console.error(`Succesfully sent error message: ${message}`);
    } catch (error) {   
        console.error(`Failed to send error message for log command ${error}`);
    }
}

module.exports = { sendErrorMessage };