const fs = require('fs');
const IRC = require("irc-framework");
require("dotenv").config();
require("colors");
const gameprices = require('./plugins/gameprices.js');
const stocks = require('./plugins/stocks.js');
const reddit = require('./plugins/reddit.js');

// Make sure an .env file exists to pull config data from
const path = './.env';

fs.access(path, fs.F_OK, (err) => {
  if (err) {
    console.error("No .env file found. Rename and edit .env.example with your settings.");
  }
});

// Instantiate bot with config data from .env
const bot = new IRC.Client();
let {
  IRC_HOST,
  IRC_PORT,
  IRC_NICK,
  IRC_USERNAME,
  IRC_CHANNEL,
  NICKSERV_PASS
} = process.env;

// Ignore messages from other bots in the channel
let ignoredNicks = ["skybot", "buttebot"];

// Filter any lines from IRC with k-line words in them so the bot doesn't get banned
let censoredStrings = [
  "DCC SEND",
  "1nj3ct",
  "thewrestlinggame",
  "startkeylogger",
  "hybux",
  "\\0",
  "\\x01",
  "!coz",
  "!tell /x"
];

// Connect the bot to IRC server
bot.connect({
  host: IRC_HOST,
  port: IRC_PORT,
  nick: IRC_NICK,
  username: IRC_USERNAME
});

// When the bot is shut down
bot.on("close", () => {
  console.log("Connection closed.");
});

bot.on("registered", () => {
  console.log(`Connected to ${IRC_HOST}.`);
  bot.say("nickserv", "identify " + NICKSERV_PASS);
  bot.join(IRC_CHANNEL);
  console.log(`Joined ${IRC_CHANNEL}.`);
});

bot.on("message", event => {
  console.log(`<${event.nick.bold.green}> ${event.message}`);

  // Basic message parsing to determine if a plugin should be activated
  if (ignoredNicks.includes(event.nick)) {
    return;
  }

  // Stock plugin trigger
  if (event.message.substring(0,6).match(/^,st(ock)?/) ||
      event.message.substring(0,6).match(/^!st(ock)?/)) {
    stocks.search(event);
  }

  // Reddit plugin trigger
  if (event.message.match(/reddit.com/)) {
    reddit.parse(event, censoredStrings);
  }

  // Game prices plugin trigger
  if (event.message.substring(0,3) === "!gp") {
    gameprices.search(event);
  }
});
