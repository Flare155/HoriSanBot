const path = require('node:path');
const puppeteer = require("puppeteer");

const buildImage = async (route, data) => {
    const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    devtools: true,
    args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--no-sandbox'
    ],
    executablePath: process.platform == "linux" ? '/usr/bin/chromium' : null, // Use an environment variable instead of checking the OS
    });
    const page = await browser.newPage();
    page.setViewport({
    width: 1500,
    height: 1000
    })    

    await page.goto(`file:${path.join(__dirname, "hori-visuals", "prod", "index.html")}`);

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

module.exports = { buildImage };