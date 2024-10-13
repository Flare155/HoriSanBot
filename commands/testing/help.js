    const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
    const Log = require('../../models/Log');
    const { testingServerId } = require('../../config.json');

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('help_dev')
            .setDescription('Learn about the bot and overview of the commands!'),
        async execute(interaction) {
            // Step 1: Create an EmbedBuilder instance
            const helpEmbed = new EmbedBuilder()
                .setColor('#c3e0e8')  // Set a color for the embed
                .setTitle('📜 Bot Commands Overview')  // Title of the embed with an emoji
                .setDescription('Here is a list of commands you can use with this bot:\nUse **/help [command]** for detailed info on a specific command.\n​') //Zero width char here for spacing in embed
                .addFields(
                    { name: '💡 `/help`', value: 'Learn about the bot and overview of the commands.', inline: false },
                    { name: '📝 `/log`', value: 'Log your immersion with a medium, title, amount, and notes.', inline: false },
                    { name: '📜 `/logs`', value: 'View your log history and see IDs of logs.', inline: false },
                    { name: '↩️ `/undo`', value: 'Undo the last log you created. **Irreversible!**', inline: false },
                    { name: '❌ `/deletelog`', value: 'Delete a specific log by its ID. **Irreversible!**', inline: false },
                    { name: '👤 `/profile`', value: 'Display an overview of all of your logged immersion', inline: false },
                    { name: '⏱️ `/selftimeout`', value: 'Time yourself out so you can focus on your immersion!', inline: false }
                )
                .setFooter({ text: 'For any additional assistance DM or @ flarenotfound on discord!' })  // Adding footer text

            // Step 3: Reply with the embed
            await interaction.reply({ embeds: [helpEmbed] });
        },
    };
