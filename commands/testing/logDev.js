const { SlashCommandBuilder, EmbedBuilder, time } = require('discord.js');
const { mongoose } = require('mongoose');
const User = require("../../models/User");
const Log = require("../../models/Log");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('log_dev')
		.setDescription('Log your immersion!')
        .addStringOption(option =>
            option.setName('medium')
                .setDescription('The type of material you immersed in')
                .setRequired(true)
                .addChoices(
                    // Audio
                    { name: 'Listening', value: 'Listening'},
                    { name: 'Podcast', value: 'Podcast' },
                    { name: 'Audiobook', value: 'Audiobook' },
                    // Audio-Visual
                    { name: 'Watchtime', value: 'Watchtime' },
                    { name: 'YouTube', value: 'YouTube' },
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Drama', value: 'Drama'},
                    { name: 'Movie', value: 'Movie'},
                    // Reading
                    { name: 'Readtime', value: 'Readtime'},
                    { name: 'Reading', value: 'Reading Char'},
                    { name: 'Light Novel', value: 'Light Novel' },
                    { name: 'Visual Novel', value: 'Visual Novel' },
                    { name: 'Manga', value: 'Manga' },
                    ))
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('The amount of immersion i.e. episodes, minutes watched, characters read')
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
            Anime: "Episodes",
            Manga: "Pages",
            Drama: "Episodes",
            YouTube: "Minutes",
            "Light Novel": "Chars",
            "Visual Novel": "Chars",
            Podcast: "Minutes",
            "Reading Char": "Chars",
            "Reading Min": "Minutes",
            Listening: "Minutes",
        };
        let mediumUnit = mediumUnits[medium];
        if (!mediumUnit) {
            await interaction.reply("Error finding medium of log");
            return;
        }
        
        // Calculate points
        let points;
        let descripton;

        // Episodes
        if (mediumUnit == "Episodes") {
            points = amountImmersed * 20;
            descripton = `20 points/episode → +${points} points`
        // Pages
        } else if (mediumUnit == "Pages") {
            points = Math.round(amountImmersed * 0.8);
            descripton = `0.8 points/page → +${points} points`
        // Minutes
        } else if (mediumUnit == "Minutes") {
            points = amountImmersed;
            descripton = `1 points/minute → +${points} points`
        // Chars
        } else if (mediumUnit == "Chars") {
            points = Math.round(amountImmersed / 400);
            descripton = `0.0025 points/character → +${points} points`
        } else {
            await interaction.reply("Error in calculating points for medium");
            return;
        };

        if (points <= 0) {
            await interaction.reply("Amount too low to log!");
            return
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
        .setTitle(` Logged ${amountImmersed} ${mediumUnit} of ${medium}!!`,)
        .setDescription(descripton)
        .setThumbnail(userAvatarURL)
        if (title != null) {
            logEmbed.addFields({ name: 'Title', value: title, inline: true });
        };
        if (notes != null) {
            logEmbed.addFields({ name: 'Notes', value: notes, inline: true });
        };
        
        // Send embed
        await interaction.reply({ embeds: [logEmbed] });
	},
};