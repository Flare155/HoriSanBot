const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
// const Log = require('../../models/Log');
// const { testingServerId } = require('../../config.json');
const puppeteer = require("puppeteer");
const path = require('node:path');
const fs = require('node:fs');  
const { Buffer } = require('buffer');
const { getLogsByDate } = require('../../utils/db/dbLogsByDate');
const User = require('../../models/User');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('graph_dev')
        .setDescription('Dev command to generate a graph'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const days = 30;
        const userData = await User.findOne({ userId: interaction.user.id });
        const userTimezone = userData ? userData.timezone : 'UTC';
        const logsByDate = await getLogsByDate(userId, days, userTimezone);
        const image = await buildImage("immersionTime", { data: logsByDate });


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


async function buildImage(route, data){
    const browser = await puppeteer.launch({
    headless: true,
    devtools: true,
    args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
    ]
    });
    const page = await browser.newPage();
    page.setViewport({
    width: 1500,
    height: 1000
    })    

    await page.goto(`file:${path.join(__dirname, "..", "..", "utils", "hori-visuals", "prod", "index.html")}`);

    await page.evaluate((route, data) => {
        window.path = route;
        window.puppeteerData = data; 
    }, route, data);    

    await page.waitForNetworkIdle();

    const image = await page.screenshot({
    type: "png",
    path: "./image.png",
    clip: {
        width: 1200,
        height: 800,
        x : 0,
        y : 0
    }});    
    await browser.close();
    return image;
}