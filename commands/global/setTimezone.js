const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');
const User = require("../../models/User");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settimezone')
        .setDescription('Sets your timezone for streak tracking.')
        .addStringOption(option =>
            option.setName('timezone')
                .setDescription('Start typing to find your timezone! (Continent/City OR City)')
                .setAutocomplete(true) // Enable autocomplete
                .setRequired(true)
        ),
    
    // Handle the command execution
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const timezoneInput = interaction.options.getString('timezone');

        // Validate the timezone using moment-timezone
        if (!moment.tz.zone(timezoneInput)) {
            return interaction.reply({ content: 'Invalid timezone. Please provide a valid timezone like America/New_York.', ephemeral: true });
        }

        try {
            // Find or create user in the database
            let user = await User.findOne({ userId: userId, guildId: guildId });

            if (!user) {
                // Create new user if not found
                user = new User({
                    userId: userId,
                    guildId: guildId,
                    timestamp: new Date().toISOString(),
                    streak: 0,
                    timezone: timezoneInput
                });
            } else {
                // Update existing user's timezone
                user.timezone = timezoneInput;
            }

            // Save the user object
            await user.save();

            // Create an embed to confirm the change
            const userAvatarURL = interaction.user.displayAvatarURL();
            const embed = new EmbedBuilder()
                .setColor('#c3e0e8')
                .setTitle(`${interaction.user.displayName}'s Timezone`)
                .setThumbnail(userAvatarURL)
                .addFields([{ name: "Timezone Set", value: `${timezoneInput}`, inline: false }])
                .setFooter({ text: 'Timezone has been successfully set.' });

            // Reply with the embed
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occurred while setting your timezone. Please try again later.', ephemeral: true });
        }
    },

    // Handle autocomplete interaction
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();  // Get the user's current input
        const allTimezones = moment.tz.names();  // Get the full list of timezones
        
        // Filter timezones based on the user's input
        const filteredTimezones = allTimezones.filter(zone => zone.toLowerCase().startsWith(focusedValue.toLowerCase())).slice(0, 25); // Return max 25 results

        // Respond to the autocomplete interaction with the filtered timezone options
        await interaction.respond(
            filteredTimezones.map(zone => ({ name: zone, value: zone }))
        );
    },
};
