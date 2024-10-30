# HorisanBot - Your Immersion Companion 🌊

Welcome to **HorisanBot**, the ultimate tool designed to enhance your language learning through immersive activities. Whether you're watching anime, reading manga, listening to podcasts, or diving into novels, HorisanBot helps track your progress and makes your language journey both fun and rewarding.

![tests result](https://github.com/Flare155/HoriSanBot/actions/workflows/tests.js.yml/badge.svg)

## Key Features 🌟

- **Activity Logging** 📝: Effortlessly log your immersive activities—watching, reading, or listening—and earn points for every logged hour.
- **Leaderboards** 🏆: See how you stack up against your friends with our competitive leaderboards. Aim for the top to become the immersion champion!
- **Personal Profiles** 📊: Get a comprehensive view of your immersion statistics and track your progress over time.
- **Self Timeout** ⏱️: Use the self-timeout feature to manage distractions and maintain focus during your language learning sessions.
- **Undo/Redo/Delete** 🔙: Easily correct any mistakes in your activity logs with log editing functionality.
- **Time Zone Management** 🌐: Set your time zone and your streak will reset at 4am just like Anki, timestamps will display to your local time.

## Getting Started 🚀

1. **Invite HorisanBot** to your Discord server. (Not public at the moment so reach out to me @flarenotfound on discord)
2. Use the `/log` command to begin tracking your activities. The more you log, the more points you earn.
3. Monitor your progress with the `/profile` command or check out the competition with `/leaderboard`.

## Why HorisanBot? 🤓

HorisanBot isn't just a tracking tool—it's your partner in the language learning journey. It motivates you by visualizing your progress, encourages competition through leaderboards, and integrates seamlessly into your daily routine. Stay motivated and see your efforts rewarded as you advance towards fluency.

## Contributing 🛠️

Want to contribute? HorisanBot is currently a mostly solo project, but I’m open to collaboration. Feel free to reach out if you're interested in developing features, fixing bugs, or providing suggestions.

## Installation

### Prerequisites

- [mongodb](https://www.mongodb.com/)
- [nodejs](https://nodejs.org/)

### Installation

After cloning the repository, run `npm i` to install all dependencies in the root of this project.

**Ubuntu**:  
This project uses [Puppeteer](https://pptr.dev/) with the Chromium browser to render graphs, so you might need to install these additional dependencies:
```sh
sudo apt-get install libx11-xcb1 libxcomposite1 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6
```

### Configuration
Copy `.env.example` and rename it to `.env.dev`. In this file, configure the MongoDB credentials and add your Discord bot token.

#### Discord bot token
To set up your new Discord bot application, follow these steps:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. Select your new app and navigate to **Bot** under **Settings**.
3. Click **Reset Token** to generate a new bot token, then copy it.
4. Open your `.env.dev` file and replace `discord bot token` with your bot token.

### Run
Execute the following command in the root of this project:
```node index.js```

## License 📜

This project is currently private. Please do not use or distribute any part of HorisanBot without permission.

## Examples

*Graph generated with the bot *(Graphs are still under development and will look better in the near future)*

![One week graph example](https://github.com/user-attachments/assets/8208d175-d1b3-4774-afca-f8bcebe9fb7d)

*The global leaderboard for monthly filterable by medium and time period*

![Profile View Example](https://github.com/user-attachments/assets/f77be04e-dd98-49e4-b4c7-09885cb90431)

*What a log looks like currently (tie-ins with anilist and other media databases expected in the future)*

![Leaderboard Example](https://github.com/user-attachments/assets/c372e3da-4d73-428a-831a-c0016ca4bba9)

*Example of editing a log*

![Settings Command Example](https://github.com/user-attachments/assets/8b9e4a09-9fec-4cde-8d02-5806c3a327b0)

