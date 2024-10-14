const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
// const Log = require('../../models/Log');
// const { testingServerId } = require('../../config.json');
const puppeteer = require("puppeteer");
const path = require('node:path');
const fs = require('node:fs');  
// // test
const { Buffer } = require('buffer');
const { getPointsByDate } = require('../../utils/db/dbPointsAggregate');
const User = require('../../models/User');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('graph_dev')
        .setDescription('dev :3'),
    async execute(interaction) {
       


       const userId = interaction.user.id; // Replace with the actual user ID
       const days = 30; // Number of days to look back
       const userData = await User.findOne({ userId: interaction.user.id });
       const userTimezone = userData ? userData.timezone : 'UTC';

       const pointsByDate = await getPointsByDate(userId, days, userTimezone);

        const image = await buildImage("/immersionTime", { data: pointsByDate });


        // Assuming `image` is your Uint8Array
        const buffer = Buffer.from(image);
        // Create an attachment from the buffer
        const attachment = new AttachmentBuilder(buffer,
            {
                name: 'image.png'
            } );

        const helpEmbed = new EmbedBuilder()
            .setColor('#c3e0e8')  // Set a color for the embed
            .setTitle('Hello world')  // Title of the embed with an emoji
            .setDescription(':3:3:3:3:3:3:3:3:3​') //Zero width char here for spacing in embed
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
    width: 500,
    height: 500
    })    


    await page.goto(`file:${path.join(__dirname, "..", "..", "utils", "hori-visuals", "prod", "index.html")}`);

    await page.evaluate((route, data) => {
        window.history.pushState({}, '', route);
        const popStateEvent = new PopStateEvent('popstate');
        window.dispatchEvent(popStateEvent);
        window.puppeteerData = data; 
    }, route, data);    

    await page.waitForNetworkIdle();

    const image = await page.screenshot({
    type: "png",
    path: "./image.png",
    clip: {
        width: 500,
        height: 500,
        x : 0,
        y : 0
    }});    
    await browser.close();
    return image;
}

buildImage("/immersionTime", { data: [] });


