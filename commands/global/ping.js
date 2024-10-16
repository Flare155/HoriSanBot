const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and detailed latency information.'),

    async execute(interaction) {
        // Record the start time for processing delay calculation
        const startTime = Date.now();
        await interaction.deferReply();

		// **1. Create and Send the Initial "Waiting" Embed**
		const waitingEmbed = new EmbedBuilder()
		.setColor(0xffa500) // Orange color to indicate loading/waiting
		.setTitle('⏳ Please wait...')
		.setDescription('Fetching latency information...')
		.setTimestamp();

		// Calculate the processing delay
		const endTime = Date.now();
		const processingDelay = endTime - startTime;

        // Initialize WebSocket ping and timing variables
        let wsRTDelay = interaction.client.ws.ping;
        const maxWaitTime = 60000; // Maximum wait time in milliseconds (60 seconds)
        const checkInterval = 1000; // Interval between checks in milliseconds (1 second)
        let elapsedTime = 0;
		const clientUptime = interaction.client.uptime

        // Send the initial "waiting" embed as a reply
        await interaction.editReply({ embeds: [waitingEmbed], ephemeral: false });

        // **2. Poll for ws.ping Initialization**
        while (wsRTDelay === -1 && elapsedTime < maxWaitTime) {
            // Wait for the specified check interval
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            elapsedTime += checkInterval;

            // Re-fetch the current WebSocket ping
            wsRTDelay = interaction.client.ws.ping;

            // **3. Update the Embed with Status Information If Still Waiting**
            if (wsRTDelay === -1 && elapsedTime < maxWaitTime) {
				// Calculate wait time for API Latency
                const estimatedWaitTime = Math.ceil(((maxWaitTime - clientUptime) - elapsedTime) / 1000);

                // Create an updated embed with status fields
                const updatedWaitingEmbed = new EmbedBuilder()
                    .setColor(0xffa500)
                    .setTitle('⏳ Please wait...')
                    .setDescription('Fetching latency information...')
                    .addFields(
						{ name: 'Processing Delay', value: `${processingDelay} ms`, inline: false },
                        { name: 'Status', value: 'Waiting for Discord API Latency...', inline: false },
                        { name: 'Estimated Max Wait Time', value: `${estimatedWaitTime} seconds`, inline: false },
                    )
					.setFooter({text: "This delay occurs only after a recent bot launch."});

                // Edit the initial reply with the updated embed
                await interaction.editReply({ embeds: [updatedWaitingEmbed] });
            }
        }
        try {
            // **4. Create the Final Embed with Latency Information**
            const finalEmbed = new EmbedBuilder()
                .setColor(0x0099ff) // Blue color for success
                .setTitle('🏓 Pong!')
                .setTimestamp()
                .addFields(
                    { name: 'Processing Time', value: `${processingDelay} ms`, inline: true },
                    { name: 'API Latency', value: wsRTDelay !== -1 ? `${wsRTDelay} ms` : 'N/A', inline: true },
                )
				.setFooter({text:"API Latency updates once a minute"});

			// Add total latency to embed
			finalEmbed.addFields(
				{ name: 'Total Latency', value: `${processingDelay + wsRTDelay} ms`, inline: true }
			);

            // Edit the initial reply with the final embed
            await interaction.editReply({ embeds: [finalEmbed] });

        } catch (error) {
            const endTime = Date.now();
            const processingDelay = endTime - startTime;
            wsRTDelay = interaction.client.ws.ping;

            if (error.status === 503) {
                // If the API is unavailable, send a timeout message with the delay time
                console.log('Discord API may be experiencing issues, informing user...');
                await interaction.editReply({
                    content: `⚠️ **Sorry, Discord's servers are likely experiencing issues.** Check: [Discord Status](https://discordstatus.com/).
                    \n_Total time: ${processingDelay} ms + ${wsRTDelay !== -1 ? wsRTDelay : 'N/A'} ms_
                    \n*(Or I\'m just bad at coding)*`,
					embeds: []
                });
            } else {
                // For any other error, send a generic failure message with the delay time
                console.error('Failed to execute Ping command.', error);
                await interaction.editReply({
                    content: `❌ **Failed to execute Ping command.**
                    \n_Total time: ${processingDelay + wsRTDelay} ms_`,
					embeds: []
                });
            }
        }
    },
};
