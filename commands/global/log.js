const { SlashCommandBuilder, EmbedBuilder, time } = require('discord.js');
const { mongoose } = require('mongoose');
const User = require("../../models/User");
const Log = require("../../models/Log");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('log')
		.setDescription('Log your immersion!')
        .addStringOption(option =>
            option.setName('medium')
                .setDescription('The type of material you immersed in')
                .setRequired(true)
                .addChoices(
                    // Audio
                    { name: 'Listening', value: 'Listening'},
                    // Audio-Visual
                    { name: 'Watchtime', value: 'Watchtime' },
                    { name: 'YouTube', value: 'YouTube' },
                    { name: 'Anime', value: 'Anime' },
                    // Reading
                    { name: 'Readtime', value: 'Readtime'},
                    { name: 'Visual Novel', value: 'Visual Novel' },
                    { name: 'Manga', value: 'Manga' },
                    ))
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('The amount of minutes immersed or episodes of anime')
                .setRequired(true)
            )
        .addStringOption(option =>
            option.setName('title')
            .setDescription('The title of the media')
            .setRequired(true)
            )
        .addStringOption(option =>
            option.setName('notes')
            .setDescription('Any notes you want to write (OPTIONAL)')
            .setRequired(false)
            ),

    // All the scripts that will run with this command
	async execute(interaction) {
        const medium = interaction.options.getString('medium');
        const amountImmersed = interaction.options.getNumber('amount');
        const title = interaction.options.getString('title');
        const notes = interaction.options.getString('notes');

        // Find medium of the log
        const mediumUnits = {
            // Audio
            Listening: "Minutes",
            // Audio-Visual
            Watchtime: "Minutes",
            YouTube: "Minutes",
            Anime: "Episodes",
            // Reading
            Readtime: "Minutes",
            "Visual Novel": "Minutes",
            Manga: "Minutes",
        };
        let mediumUnit = mediumUnits[medium];
        if (!mediumUnit) {
            await interaction.reply("Error finding medium of log");
            return;
        }
        
        // Calculate points and description for embed
        let points;
        let description;
        
        if (mediumUnit === "Episodes") {
            points = amountImmersed * 20;
            description = `20 points/episode → +${points} points`;
        } else {
            points = amountImmersed;
            description = `1 point/minute → +${points} points`;
        }
        
        if (points <= 0) {
            await interaction.reply("Amount too low to log!");
            return;
        }

        if (points > 1200) {
            await interaction.reply("The maximum log size is 1200 minutes (20hrs)");
            return;
        }

        // Save info to database
        async function saveLog() {
            let user;
            let log;
        
            try {
                const userExists = await User.exists({ userId: interaction.user.id });
            
                if (!userExists) {
                    user = new User({ 
                        userId: interaction.user.id, 
                        guildId: interaction.guild.id, 
                        timestamp: Date(),
                    });
                    await user.save();
                };
        
                log = new Log({
                    userId: interaction.user.id, 
                    guildId: interaction.guild.id, 
                    timestamp: Date(),
                    medium: medium,
                    unit: mediumUnit,
                    amount: amountImmersed,
                    points: points,
                    title: title,
                    notes: notes    
                
                });
                await log.save();
            } catch (error) {
                console.error("Error saving log:", error);
            }
        };
        
        await saveLog();
        

        // Embed response:
        const userAvatarURL = interaction.user.displayAvatarURL();
        
        // Make embed for log message
        const logEmbed = new EmbedBuilder()
        .setColor('#c3e0e8')
        .setTitle(`${interaction.user.displayName} Logged ${amountImmersed} ${mediumUnit} of ${medium}!!`,)
        .setDescription(description)
        .setThumbnail(userAvatarURL)
        logEmbed.addFields({ name: 'Title', value: title, inline: true });
        if (notes) {
            logEmbed.addFields({ name: 'Notes', value: notes, inline: true });
        }
        
        // Send embed
        await interaction.reply({ embeds: [logEmbed] });
	},
};