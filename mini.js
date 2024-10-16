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
    executablePath: process.platform == "linux" ? '/usr/bin/google-chrome' : null, // Use an environment variable instead of checking the OS
    });

console.log("✅ Browser initialised.");
}

a();