# adarbot
An internet relay chat (IRC) bot written with JavaScript/Node.

### Plugins:
- Weather data for a given location (Temperature, humidity, wind speed) `!we [location]`
- Stock data (ex. `!st AMD` returns market data for Advanced Micro Devices.)
- Reddit link parsing (can differentiate between posts and comments; for posts the bot returns title of thread, and if a comment is linked it returns the body of the comment.)
- PC game pricing returns the lowest price for a PC game via IsThereAnyDeal.com, which searches several online stores for prices. `!gp [game name]`
### Usage:
- Make sure you have node/npm installed; you can either use `nvm` or install via an alternate method at [nodejs.org](https://nodejs.org).
- Clone the repo to your deploy location via `git clone https://github.com/sharma/adarbot.git`.
- Run `npm install` in the cloned repo folder to install necessary dependencies from NPM.
- Rename `.env.example` to `.env` and fill in the needed values. 
- An IEX API key for the stock market functionality can be acquired from `https://iexcloud.io/`.
- An IsThereAnyDeal API key for game pricing functionality can be acquired from `https://isthereanydeal.com/dev/app/`.
- Start the bot by running `node app.js`.
