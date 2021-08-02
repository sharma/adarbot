require("dotenv").config();
require("colors");

const fs = require('fs');
const IRC = require("irc-framework");
const gameprices = require('./plugins/gameprices.js');
const stocks = require('./plugins/stocks.js');
const reddit = require('./plugins/reddit.js');
const weather = require('./plugins/weather.js');
const opencritic = require('./plugins/opencritic.js');
const movies = require('./plugins/movies.js');

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
  NICKSERV_PASS,
  ADMINS
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
  username: IRC_USERNAME,
  password: NICKSERV_PASS
});

bot.on("registered", () => {   // Just in case IRC server doesn't accept auth via SASL
  console.log(`Connected to ${IRC_HOST}.`);
  bot.whois(IRC_NICK);
  bot.join(IRC_CHANNEL);
  console.log(`Joined ${IRC_CHANNEL}.`);
});

// When the bot is shut down
bot.on("close", () => {
  console.log("Connection closed.");
});

bot.on("message", event => {
  console.log(`<${event.nick.bold.green}> ${event.message}`);

  if (ignoredNicks.includes(event.nick)) {
    return;
  }

  if (event.message === ",help") {
    event.reply(`${event.nick}: Commands: ,st - Stock prices | ,oc - OpenCritic game reviews | ,gp - Game prices`);
  }

  else if ((event.message === ",rejoin") && (ADMINS.includes(event.nick)) && (event.type === "privmsg")) {
    bot.part(IRC_CHANNEL);
    bot.join(IRC_CHANNEL);
    console.log(`Rejoined ${IRC_CHANNEL}`);
  }

  // Stock plugin trigger
  else if (event.message.substring(0,6).match(/^,st(ock)?/) ||
      event.message.substring(0,6).match(/^!st(ock)?/)) {
    stocks.search(event);
  }

  // Reddit plugin trigger
  else if (event.message.match(/reddit.com/)) {
    reddit.parse(event, censoredStrings);
  }

  // Game prices plugin trigger
  else if (event.message.substring(0,4) === ",gp ") {
    gameprices.search(event);
  }

  // Weather plugin trigger
  else if (event.message.substring(0,4) === ",we ") {
    weather.search(event);
  }

  // OpenCritic plugin trigger
  else if (event.message.substring(0,4) === ",oc ") {
    opencritic.search(event);
  }

  else if (event.message.substring(0,4) === ",rt ") {
    movies.search(event);
  }
});
