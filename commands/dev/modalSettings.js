// const { 
//     SlashCommandBuilder, 
//     ModalBuilder, 
//     TextInputBuilder, 
//     ActionRowBuilder, 
//     TextInputStyle 
// } = require('discord.js');

// module.exports = {
//     data: new SlashCommandBuilder()
//         .setName('modal_settings')
//         .setDescription('Edit your settings using a modal.'),
//     async execute(interaction) {
//         // Create the modal
//         const modal = new ModalBuilder()
//             .setCustomId('settingsModal')
//             .setTitle('Edit Your Settings');

//         // Time Zone: When displaying data for the user, times are shown in their local time zone.
//         const timezoneInput = new TextInputBuilder()
//             .setCustomId('timezone')
//             .setLabel('Time Zone (e.g., UTC, EST, PST)')
//             .setStyle(TextInputStyle.Short)
//             .setPlaceholder('Enter your time zone')
//             .setRequired(true);

//         // Preferred Mediums: Using the same options as your log command.
//         const mediumsInput = new TextInputBuilder()
//             .setCustomId('mediums')
//             .setLabel('Preferred Mediums')
//             .setStyle(TextInputStyle.Paragraph)
//             // Shortened placeholder to meet the 100-character limit.
//             .setPlaceholder('Comma-separated (e.g., Listening, Anime, Manga)')
//             .setRequired(false);

//         // Notification Preference: Whether or not to get reminders for goals, etc.
//         const notificationPreferenceInput = new TextInputBuilder()
//             .setCustomId('notificationPreference')
//             .setLabel('Notification Preference (true/false)')
//             .setStyle(TextInputStyle.Short)
//             .setPlaceholder('true or false')
//             .setRequired(true);

//         // Default Logging Language: Language to tag logs with by default.
//         const defaultLoggingLanguageInput = new TextInputBuilder()
//             .setCustomId('defaultLoggingLanguage')
//             .setLabel('Default Logging Language (e.g., en, es)')
//             .setStyle(TextInputStyle.Short)
//             .setPlaceholder('Enter a language code')
//             .setRequired(true);

//         // Day End: The time at which today ends and the next day starts for the user.
//         const dayEndInput = new TextInputBuilder()
//             .setCustomId('dayEnd')
//             .setLabel('Day End Time (HH:mm, 24-hour format)')
//             .setStyle(TextInputStyle.Short)
//             .setPlaceholder('e.g., 04:00')
//             .setRequired(true);

//         // Create action rows (Discord allows up to 5 action rows per modal)
//         const row1 = new ActionRowBuilder().addComponents(timezoneInput);
//         const row2 = new ActionRowBuilder().addComponents(mediumsInput);
//         const row3 = new ActionRowBuilder().addComponents(notificationPreferenceInput);
//         const row4 = new ActionRowBuilder().addComponents(defaultLoggingLanguageInput);
//         const row5 = new ActionRowBuilder().addComponents(dayEndInput);

//         // Add the action rows to the modal
//         modal.addComponents(row1, row2, row3, row4, row5);

//         // Show the modal to the user
//         await interaction.showModal(modal);
//     },
// };
