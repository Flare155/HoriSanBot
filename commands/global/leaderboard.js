const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
  } = require('discord.js');
  const { DateTime } = require('luxon');
  const Log = require('../../models/Log');
  const { toPoints } = require('../../utils/formatting/toPoints');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('Show a leaderboard of the top players')
      .addStringOption((option) =>
        option
          .setName('period')
          .setDescription('Time period of the leaderboard')
          .setRequired(true)
          .addChoices(
            { name: 'All Time', value: 'All Time' },
            { name: 'Yearly', value: 'Yearly' },
            { name: 'Monthly', value: 'Monthly' },
            { name: 'Weekly', value: 'Weekly' },
            { name: 'Daily', value: 'Daily' }
          )
      )
      .addStringOption((option) =>
        option
          .setName('scope')
          .setDescription('What users to include in the leaderboard')
          .setRequired(true)
          .addChoices(
            { name: 'Global', value: 'Global' },
            { name: 'This Server', value: 'Server' },
            { name: 'Friends', value: 'Friends' },
          )
      )
      .addStringOption((option) =>
        option
          .setName('medium')
          .setDescription('The medium of the leaderboard')
          .setRequired(false)
          .addChoices(
            { name: 'All', value: 'All' },
            { name: 'Listening', value: 'Listening' },
            { name: 'Watchtime', value: 'Watchtime' },
            { name: 'YouTube', value: 'YouTube' },
            { name: 'Anime', value: 'Anime' },
            { name: 'Readtime', value: 'Readtime' },
            { name: 'Visual Novel', value: 'Visual Novel' },
            { name: 'Manga', value: 'Manga' },
            { name: 'Speaking', value: 'Speaking' },
            { name: 'Writing', value: 'Writing' }
          )
      ),
  
    async execute(interaction) {
      await interaction.deferReply();
  
      // Gather inputs
      const timePeriod = interaction.options.getString('period');
      const scope = interaction.options.getString('scope');
      const medium = interaction.options.getString('medium') || 'All';
  
      // Luxon DateTime to track the current time reference
      let referenceDate = DateTime.local();
  
      // Helper to shift reference date by 1 period
      function shiftReferenceDate(direction) {
        if (timePeriod === 'Daily') {
          referenceDate = referenceDate.plus({ days: direction });
        } else if (timePeriod === 'Weekly') {
          referenceDate = referenceDate.plus({ weeks: direction });
        } else if (timePeriod === 'Monthly') {
          referenceDate = referenceDate.plus({ months: direction });
        } else if (timePeriod === 'Yearly') {
          referenceDate = referenceDate.plus({ years: direction });
        }
      }
  
      // Helper to build label for the current period
      function buildTimeLabel() {
        if (timePeriod === 'Daily') {
          return referenceDate.toFormat('MMM d, yyyy');
        } else if (timePeriod === 'Weekly') {
          return `Week of ${referenceDate.toFormat('MMM d, yyyy')}`;
        } else if (timePeriod === 'Monthly') {
          return referenceDate.toFormat('MMMM yyyy');
        } else if (timePeriod === 'Yearly') {
          return referenceDate.toFormat('yyyy');
        }
        return '';
      }
  
      // Helper to compute time range
      function calculateTimeRange() {
        if (timePeriod === 'All Time') {
          return { startDate: null, endDate: null };
        }
  
        let start;
        let end;
  
        if (timePeriod === 'Daily') {
          start = referenceDate.startOf('day');
          end = referenceDate.endOf('day');
        } else if (timePeriod === 'Weekly') {
          start = referenceDate.startOf('week');
          end = referenceDate.endOf('week');
        } else if (timePeriod === 'Monthly') {
          start = referenceDate.startOf('month');
          end = referenceDate.endOf('month');
        } else if (timePeriod === 'Yearly') {
          start = referenceDate.startOf('year');
          end = referenceDate.endOf('year');
        }
  
        return {
          startDate: start.toJSDate(),
          endDate: end.toJSDate()
        };
      }
  
      // Fetch leaderboard data from Mongo
      async function fetchLeaderboardData() {
        const { startDate, endDate } = calculateTimeRange();
        const timeMatch = {};
  
        if (timePeriod !== 'All Time') {
          timeMatch.timestamp = { $gte: startDate, $lte: endDate };
        }
  
        const watchtimeSubcategories = ['Watchtime', 'YouTube', 'Anime'];
        const readtimeSubcategories = ['Readtime', 'Manga', 'Visual Novel'];
  
        const mediumMatch = {};
        if (medium === 'Watchtime') {
          mediumMatch.medium = { $in: watchtimeSubcategories };
        } else if (medium === 'Readtime') {
          mediumMatch.medium = { $in: readtimeSubcategories };
        } else if (medium !== 'All') {
          mediumMatch.medium = medium;
        }

        // get all user IDs for users in this server
        const scopeMatch = {};
        if (scope === 'Server') {
          const members = await interaction.guild.members.fetch();
          const userIdsInServer = members.map(member => member.user.id);
          scopeMatch.userId = { $in: userIdsInServer };
        } else if (scope === 'Friends') {
          // Friends feature is not implemented yet.
          await interaction.editReply("Friends feature coming soon");
          return []; // Return an empty array to stop further processing.
        }
  
        const pipeline = [
          { $match: timeMatch },
          { $match: mediumMatch },
          { $match: scopeMatch },
          {
            $group: {
              _id: '$userId',
              totalSeconds: { $sum: '$amount.totalSeconds' }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: 'userId',
              as: 'userData'
            }
          },
          { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              totalSeconds: 1,
              displayName: '$userData.displayName'
            }
          },
          { $sort: { totalSeconds: -1 } }
        ];
  
        return Log.aggregate(pipeline);
      }
  
      // Build pagination controls
      function buildPaginationRow(currentPage, totalPages) {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('◀')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1),
          new ButtonBuilder()
            .setCustomId('page_indicator')
            .setLabel(`Page ${currentPage} / ${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages)
        );
      }
  
      // Build time nav row (only if not All Time)
      function buildTimeNavigationRow() {
        if (timePeriod === 'All Time') return null;
  
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev_period')
            .setLabel('◀')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('time_indicator')
            .setLabel(buildTimeLabel())
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next_period')
            .setLabel('▶')
            .setStyle(ButtonStyle.Primary)
        );
      }
  
      // Build the main leaderboard embed
      function buildLeaderboardEmbed(allUsers, currentPage, pageSize) {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageSlice = allUsers.slice(startIndex, endIndex);
  
        // Build the fields for just this "page"
        const fields = pageSlice.map((user, idx) => {
          const rank = startIndex + idx + 1;
          const isCurrentUser = user._id === interaction.user.id;
  
          // Bold the current user's display name
          const displayName = isCurrentUser
            ? `🔹${user.displayName ?? 'Unknown User'}`
            : (user.displayName ?? 'Unknown User');
  
          return {
            name: `${rank}. ${displayName}`,
            value: `\`${toPoints(user.totalSeconds)} points\``
          };
        });
  
        // If the current user isn't on this page but is in the data set, append them
        const currentUserIndex = allUsers.findIndex(u => u._id === interaction.user.id);
        const currentUserPosition = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
        const currentUserData = currentUserIndex >= 0 ? allUsers[currentUserIndex] : null;
        const currentUserPoints = currentUserData ? toPoints(currentUserData.totalSeconds) : 0;
        const currentUserDisplayName = currentUserData
          ? (currentUserData.displayName ?? 'Unknown User')
          : interaction.user.displayName;
  
        const embed = new EmbedBuilder()
          .setColor('#c3e0e8')
          .setTitle(`${timePeriod} ${medium} Immersion Leaderboard`)
          .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL()
          })
          .setThumbnail('https://media.giphy.com/media/vNY0UZX11LcNW/giphy.gif')
          .setTimestamp()
          .addFields(fields);
  
        // Append current user below the page if not shown above
        if (
          currentUserPosition &&
          (currentUserPosition < startIndex + 1 || currentUserPosition > endIndex)
        ) {
          // Add spacing to the last "top 10" field, if present
          if (fields.length > 0) {
            fields[fields.length - 1].value += '\n\u200B';
          }
          // Bold them as well
          embed.addFields({
            name: `${currentUserPosition}. 🔹${currentUserDisplayName}`,
            value: `\`${currentUserPoints} points\``
          });
        }
  
        return embed;
      }
  
      // 2. Fetch initial data
      let allUsers = await fetchLeaderboardData();
      let currentPage = 1;
      const totalEntries = allUsers.length;
      let totalPages = Math.ceil(totalEntries / 10);
  
      // Build the initial embed
      let leaderboardEmbed = buildLeaderboardEmbed(allUsers, currentPage, 10);
      let paginationRow = buildPaginationRow(currentPage, totalPages);
      let timeRow = buildTimeNavigationRow();
  
      // Only push timeRow if not All Time
      const componentRows = [paginationRow];
      if (timeRow) componentRows.push(timeRow);
  
      // Send the initial reply
      const message = await interaction.editReply({
        embeds: [leaderboardEmbed],
        components: componentRows
      });
  
      // 3. Collector for pagination/time nav
      const filter = (btnInt) => btnInt.user.id === interaction.user.id;
      const collector = message.createMessageComponentCollector({ filter, time: 60_000 });
  
      collector.on('collect', async (i) => {
        if (i.customId === 'prev_page') {
          if (currentPage > 1) {
            currentPage--;
          }
        } else if (i.customId === 'next_page') {
          if (currentPage < totalPages) {
            currentPage++;
          }
        } else if (i.customId === 'prev_period') {
          shiftReferenceDate(-1);
          allUsers = await fetchLeaderboardData();
          currentPage = 1;
        } else if (i.customId === 'next_period') {
          shiftReferenceDate(1);
          allUsers = await fetchLeaderboardData();
          currentPage = 1;
        }
  
        // Recompute totalPages after possible data changes
        totalPages = Math.ceil(allUsers.length / 10);
  
        leaderboardEmbed = buildLeaderboardEmbed(allUsers, currentPage, 10);
        paginationRow = buildPaginationRow(currentPage, totalPages);
        timeRow = buildTimeNavigationRow();
  
        const newComponents = [paginationRow];
        if (timeRow) newComponents.push(timeRow);
  
        await i.update({
          embeds: [leaderboardEmbed],
          components: newComponents
        });
      });
  
      // 4. Disable all buttons at collector end
      collector.on('end', async () => {
        const disabledPaginationRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('◀')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('page_indicator')
            .setLabel(`Page ${currentPage} / ${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
  
        const disabledTimeRow = timeRow
          ? new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('prev_period')
                .setLabel('◀')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId('time_indicator')
                .setLabel(buildTimeLabel())
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId('next_period')
                .setLabel('▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
            )
          : null;
  
        const finalComponents = disabledTimeRow
          ? [disabledPaginationRow, disabledTimeRow]
          : [disabledPaginationRow];
  
        await message.edit({
          components: finalComponents
        });
      });
    }
  };
  