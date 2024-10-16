const { default: puppeteer } = require("puppeteer");
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute() {
        try {
            const browser = await puppeteer.launch({
                headless: true,
                defaultViewport: null,
                // See this page for info on white page issues https://stackoverflow.com/questions/78996364/chrome-129-headless-shows-blank-window
                args: [
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins',
                    '--disable-site-isolation-trials',
                    '--no-sandbox',
                    '--remote-debugging-port=9222',
                    '--window-position=-2400,-2400'
                ],
                executablePath: process.env.CHROME_EXECUTABLE_PATH || (process.platform === "linux" ? '/snap/bin/chromium' : null),
            });

            // Open and immediately close a dummy page to force initialization
            const page = await browser.newPage();
            await page.close();

            console.log("✅ Browser initialised.");
        } catch (error) {
            console.error("❌ Failed to initialize browser:", error);
        }
    },
};