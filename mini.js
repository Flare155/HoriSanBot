const puppeteer = require("puppeteer");

const a = async () => {
    const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--no-sandbox',
        '--remote-debugging-port=9222'
    ],
    });

console.log("✅ Browser initialised.");
}

a();