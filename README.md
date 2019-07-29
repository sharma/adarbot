# adarbot
An internet relay chat (IRC) bot written with JavaScript/Node.

### Plugins:
- Stock data (ex. `,st AMD` returns market data for Advanced Micro Devices.
- Reddit link parsing (can differentiate between posts and comments; for posts the bot returns title of thread, and if a comment is linked it returns the body of the comment.)

### Usage:
- Make sure you have Node/NPM installed; you can either use `nvm` or install via an alternate method at nodejs.org.
- Clone the repo to your deploy location via `git clone https://github.com/sharma/adarbot.git`.
- Run `npm install` in the cloned repo folder to install necessary dependencies from NPM.
- Rename `.env.example` to `.env` and fill in the needed values. an IEX API key for the stock market functionality can be acquired from IEX Cloud.
- Start the bot with `node app.js`.
