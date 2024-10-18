const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Buffer } = require('buffer');
const User = require('../../models/User');
const { immersionByTimePeriod } = require('../../utils/graph-data/immersionByTimePeriod');
const { buildImage } = require('../../utils/buildImage');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('graph_dev')
        .setDescription('Dev command to generate a graph')
        .addStringOption(option =>
            option.setName('period')
                .setDescription('Time period of the data to display')
                .setRequired(true)
                .addChoices(
                    { name: 'All Time', value: 'All Time' },
                    { name: 'Yearly', value: 'Yearly' },
                    { name: 'Monthly', value: 'Monthly' },
                    { name: 'Weekly', value: 'Weekly' },
                )),
    async execute(interaction) {
        const userId = interaction.user.id;
        const timePeriod = interaction.options.getString('period');
        const userData = await User.findOne({ userId: interaction.user.id });
        const userTimezone = userData ? userData.timezone : 'UTC';
        const graphData = await immersionByTimePeriod(userId, timePeriod, userTimezone);
        const image = await buildImage("immersionTime", { data: graphData });


        // Assuming `image` is your Uint8Array
        const buffer = Buffer.from(image);
        // Create an attachment from the buffer
        const attachment = new AttachmentBuilder(buffer,
            {
                name: 'image.png'
            } );

        const helpEmbed = new EmbedBuilder()
            .setColor('#c3e0e8')  // Set a color for the embed
            .setTitle('Monthly Immersion Graph')  // Title of the embed with an emoji
            // .setDescription('Monthly immersion graph') //Zero width char here for spacing in embed
            .setImage('attachment://image.png')
            .setFooter({ text: 'For any additional assistance DM or @ flarenotfound on discord!' })  // Adding footer text
        interaction.reply({embeds: [helpEmbed], files: [attachment]});
    },
};


