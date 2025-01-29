const { 
	SlashCommandBuilder, 
	EmbedBuilder, 
	ActionRowBuilder, 
	ButtonBuilder, 
	ButtonStyle 
  } = require('discord.js');
  
  const { DateTime } = require('luxon'); // <-- Import Luxon
  const Log = require('../../models/Log');
  const { toPoints } = require('../../utils/formatting/toPoints');
  
  module.exports = {
	data: new SlashCommandBuilder()
	  .setName('leaderboard')
	  .setDescription('Show a leaderboard of the top players')
	  .addStringOption(option =>
		option.setName('period')
		  .setDescription('Time period of the leaderboard')
		  .setRequired(true)
		  .addChoices(
			{ name: 'All Time', value: 'All Time' },
			{ name: 'Yearly', value: 'Yearly' },
			{ name: 'Monthly', value: 'Monthly' },
			{ name: 'Weekly', value: 'Weekly' },
			{ name: 'Daily', value: 'Daily' },
		  )
	  )
	  .addStringOption(option =>
		option.setName('medium')
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
			{ name: 'Writing', value: 'Writing' },
		  )
	  ),
  
	async execute(interaction) {
	  await interaction.deferReply();
  
	  // 1. Gather options
	  const medium = interaction.options.getString('medium') || 'All';
	  const timePeriod = interaction.options.getString('period');
  
	  // We'll maintain a Luxon DateTime to track which time range we are displaying
	  // Start with 'now' in local timezone. Adjust as needed for your environment/timezone.
	  let referenceDate = DateTime.local();
  
	  // Helper function to increment or decrement the reference date by 1 period
	  function shiftReferenceDate(direction) {
		// direction = +1 (next) or -1 (previous)
		if (timePeriod === 'Daily') {
		  referenceDate = referenceDate.plus({ days: direction });
		} else if (timePeriod === 'Weekly') {
		  referenceDate = referenceDate.plus({ weeks: direction });
		} else if (timePeriod === 'Monthly') {
		  referenceDate = referenceDate.plus({ months: direction });
		} else if (timePeriod === 'Yearly') {
		  referenceDate = referenceDate.plus({ years: direction });
		}
		// If 'All Time', do nothing (row won't even show).
	  }
  
	  // Helper function to label the current time period
	  // You can adjust formats for a style you prefer
	  function buildTimeLabel() {
		if (timePeriod === 'Daily') {
		  // e.g. "Jan 28, 2025"
		  return referenceDate.toFormat('MMM d, yyyy');
		} else if (timePeriod === 'Weekly') {
		  // e.g. "Week of Jan 28, 2025"
		  // Alternatively, show the entire range from startOf('week') to endOf('week'):
		  // but let's keep it simple and just show the reference day
		  return `Week of ${referenceDate.toFormat('MMM d, yyyy')}`;
		} else if (timePeriod === 'Monthly') {
		  // e.g. "January 2025"
		  return referenceDate.toFormat('MMMM yyyy');
		} else if (timePeriod === 'Yearly') {
		  // e.g. "2025"
		  return referenceDate.toFormat('yyyy');
		}
		return ''; // for "All Time", we'll omit the row entirely
	  }
  
	  // Compute the actual startDate (and possibly endDate) for the aggregator
	  // using Luxon’s startOf(...) and endOf(...)
	  function calculateTimeRange() {
		if (timePeriod === 'All Time') {
		  return { startDate: null, endDate: null };
		}
  
		let start;
		let end;
  
		if (timePeriod === 'Daily') {
		  // Start = start of current day
		  start = referenceDate.startOf('day');
		  // End = end of current day
		  end = referenceDate.endOf('day');
		} else if (timePeriod === 'Weekly') {
		  // Start = start of current week
		  start = referenceDate.startOf('week');
		  // End = end of current week
		  end = referenceDate.endOf('week');
		} else if (timePeriod === 'Monthly') {
		  start = referenceDate.startOf('month');
		  end = referenceDate.endOf('month');
		} else if (timePeriod === 'Yearly') {
		  start = referenceDate.startOf('year');
		  end = referenceDate.endOf('year');
		}
  
		// Return JS Dates (for MongoDB $match)
		return {
		  startDate: start.toJSDate(),
		  endDate: end.toJSDate(),
		};
	  }
  
	  // Re-usable function to do the aggregator given the time range
	  async function fetchLeaderboardData() {
		const { startDate, endDate } = calculateTimeRange();
		let timeMatch = {};
  
		if (timePeriod !== 'All Time') {
		  // We'll filter by $gte: startDate, $lt: endDate
		  timeMatch.timestamp = { $gte: startDate, $lte: endDate };
		  // If you prefer strict less-than for the end, replace $lte with $lt: endDate
		}
  
		const watchtimeSubcategories = ['Watchtime', 'YouTube', 'Anime'];
		const readtimeSubcategories = ['Readtime', 'Manga', 'Visual Novel'];
  
		let mediumMatch = {};
		if (medium === 'Watchtime') {
		  mediumMatch.medium = { $in: watchtimeSubcategories };
		} else if (medium === 'Readtime') {
		  mediumMatch.medium = { $in: readtimeSubcategories };
		} else if (medium !== 'All') {
		  mediumMatch.medium = medium;
		}
  
		const pipeline = [
		  { $match: timeMatch },
		  { $match: mediumMatch },
		  {
			$group: {
			  _id: "$userId",
			  totalSeconds: { $sum: "$amount.totalSeconds" }
			}
		  },
		  {
			$lookup: {
			  from: "users",
			  localField: "_id",
			  foreignField: "userId",
			  as: "userData"
			}
		  },
		  { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
		  {
			$project: {
			  totalSeconds: 1,
			  displayName: "$userData.displayName"
			}
		  },
		  { $sort: { totalSeconds: -1 } }
		];
  
		return Log.aggregate(pipeline);
	  }
  
	  // Build pagination row (row #1)
	  function buildPaginationRow(currentPage, totalPages) {
		return new ActionRowBuilder()
		  .addComponents(
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
  
	  // Build time navigation row (row #2). Only show if timePeriod != 'All Time'
	  function buildTimeNavigationRow() {
		if (timePeriod === 'All Time') return null; // no row
		const label = buildTimeLabel();
  
		return new ActionRowBuilder()
		  .addComponents(
			new ButtonBuilder()
			  .setCustomId('prev_period')
			  .setLabel('◀')
			  .setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
			  .setCustomId('time_indicator')
			  .setLabel(label)
			  .setStyle(ButtonStyle.Primary)
			  .setDisabled(true),
			new ButtonBuilder()
			  .setCustomId('next_period')
			  .setLabel('▶')
			  .setStyle(ButtonStyle.Primary)
		  );
	  }
  
	  // Build the final Embed for the current data and page
	  function buildLeaderboardEmbed(allUsers, currentPage, pageSize) {
		const startIndex = (currentPage - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		const pageSlice = allUsers.slice(startIndex, endIndex);
  
		const fields = pageSlice.map((user, idx) => {
		  const rank = startIndex + idx + 1;
		  return {
			name: `${rank}. ${user.displayName ?? 'Unknown User'}`,
			value: `\`${toPoints(user.totalSeconds)} points\``
		  };
		});
  
		// Current user info
		const currentUserIndex = allUsers.findIndex(u => u._id === interaction.user.id);
		const currentUserPosition = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
		const currentUserData = currentUserIndex >= 0 ? allUsers[currentUserIndex] : null;
		const currentUserPoints = currentUserData ? toPoints(currentUserData.totalSeconds) : 0;
		const currentUserDisplayName = currentUserData
		  ? (currentUserData.displayName ?? "Unknown User")
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
  
		// If the current user is not on this page but is in the full set
		if (currentUserPosition && (currentUserPosition < startIndex + 1 || currentUserPosition > endIndex)) {
		  embed.addFields({
			name: `${currentUserPosition}. ${currentUserDisplayName}`,
			value: `\`${currentUserPoints} points\``
		  });
		}
  
		return embed;
	  }
  
	  // 2. Fetch initial data & set up
	  let allUsers = await fetchLeaderboardData();
	  let currentPage = 1;
	  let totalEntries = allUsers.length;
	  let totalPages = Math.ceil(totalEntries / 10);
  
	  // Build the first embed
	  let leaderboardEmbed = buildLeaderboardEmbed(allUsers, currentPage, 10);
	  let paginationRow = buildPaginationRow(currentPage, totalPages);
	  let timeRow = buildTimeNavigationRow();
  
	  // Only push timeRow if it exists (i.e., not All Time)
	  const componentRows = [paginationRow];
	  if (timeRow) componentRows.push(timeRow);
  
	  // Send initial reply
	  const message = await interaction.editReply({
		embeds: [leaderboardEmbed],
		components: componentRows
	  });
  
	  // 3. Create a collector to handle all button clicks
	  const filter = (btnInt) => btnInt.user.id === interaction.user.id;
	  const collector = message.createMessageComponentCollector({ filter, time: 60_000 });
  
	  collector.on('collect', async (i) => {
		// Which button was clicked?
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
		  // re-fetch aggregator results after shifting date
		  allUsers = await fetchLeaderboardData();
		  currentPage = 1; // Reset to first page
		} else if (i.customId === 'next_period') {
		  shiftReferenceDate(+1);
		  allUsers = await fetchLeaderboardData();
		  currentPage = 1; // Reset to first page
		}
  
		// Rebuild everything
		totalEntries = allUsers.length;
		totalPages = Math.ceil(totalEntries / 10);
  
		leaderboardEmbed = buildLeaderboardEmbed(allUsers, currentPage, 10);
		paginationRow = buildPaginationRow(currentPage, totalPages);
		timeRow = buildTimeNavigationRow();
  
		// Combine rows again
		const newComponents = [paginationRow];
		if (timeRow) newComponents.push(timeRow);
  
		// Update the message
		await i.update({
		  embeds: [leaderboardEmbed],
		  components: newComponents
		});
	  });
  
	  // 4. When collector ends, disable all buttons
	  collector.on('end', async () => {
		// We'll disable both rows for a final, unclickable state
		const disabledPaginationRow = new ActionRowBuilder()
		  .addComponents(
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
		  ? new ActionRowBuilder()
			  .addComponents(
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
	},
  };
  