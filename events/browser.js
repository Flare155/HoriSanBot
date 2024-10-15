const puppeteer = require('puppeteer'); // Import puppeteer (bundled with Chromium)
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute() {
        try {
            // Launch Puppeteer with the bundled Chromium version
            const browser = await puppeteer.launch({
                headless: true,  // Run headless
                defaultViewport: null,  // Use the default viewport
                args: [
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins',
                    '--disable-site-isolation-trials',
                    '--no-sandbox',
                    '--remote-debugging-port=9222'  // Enable remote debugging
                ]
            });

            console.log("✅ Browser initialised.");
        } catch (error) {
            console.error("❌ Error initializing the browser:", error);
        }
    },
};
