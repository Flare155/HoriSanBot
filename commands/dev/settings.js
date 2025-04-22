const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder 
  } = require('discord.js');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('settings-manage-mediums')
      .setDescription('Manage your preferred mediums using a multi-select menu.'),
      
    async execute(interaction) {
      // Build the multi-select menu with the options.
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('preferredMediumsSelect')
        .setPlaceholder('Select your preferred mediums')
        .setMinValues(1)
        .setMaxValues(9) // There are 9 available options.
        .addOptions([
          { label: 'Listening', value: 'Listening' },
          { label: 'Watchtime', value: 'Watchtime' },
          { label: 'YouTube', value: 'YouTube' },
          { label: 'Anime', value: 'Anime' },
          { label: 'Readtime', value: 'Readtime' },
          { label: 'Visual Novel', value: 'Visual Novel' },
          { label: 'Manga', value: 'Manga' },
          { label: 'Speaking', value: 'Speaking' },
          { label: 'Writing', value: 'Writing' },
        ]);
      
      // Add the select menu to an action row.
      const row = new ActionRowBuilder().addComponents(selectMenu);
      
      // Send the message with the multi-select menu.
      await interaction.reply({
        content: 'Please select your preferred mediums:',
        components: [row],
        ephemeral: true,
      });
    },
  };
  