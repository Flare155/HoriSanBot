const path = require('node:path');
const puppeteer = require("puppeteer");

const buildImage = async (route, data) => {
    // Fetch the WebSocket debugger URL from Chromium
    const response = await fetch('http://localhost:9222/json/version');
    const browserData = await response.json();
    const wsEndpoint = browserData.webSocketDebuggerUrl;

    // Connect to the running Chromium instance using the WebSocket URL
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
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
    clip: {
        width: 1250,
        height: 820,
        x : 0,
        y : 0
    }});    
    return image;
}

module.exports = { buildImage };