const path = require('node:path');
const puppeteer = require("puppeteer");

const buildImage = async (route, data) => {
    const browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222' // Use the same port you specified above
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
        width: 1200,
        height: 800,
        x : 0,
        y : 0
    }});    
    return image;
}

module.exports = { buildImage };