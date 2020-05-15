const fs = require('fs');
const IRC = require("irc-framework");
const axios = require("axios");
const c = require("irc-colors");
const he = require("he");
require("dotenv").config();
require("colors");

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
  if (event.message.match(/^,st(ock)?/) || event.message.match(/^!st(ock)?/)) {
    stocks(event);
  }
  if (event.message.match(/reddit.com/)) {
    reddit(event);
  }
  if (event.message.match(/^!gp/)) {
    gameprices(event);
  }
});

// Stock plugin
// TODO: Move it into its own file
async function stocks(event) {
  const to_join = event.message.split(" ");
  const query =
    "https://cloud.iexapis.com/stable/stock/" + to_join[1] + "/quote";
  await axios
    .get(query, {
      params: {
        token: process.env.IEX_API_KEY
      }
    })
    .then(response => {
      let {
        companyName,
        symbol,
        latestPrice,
        marketCap
      } = response.data;

      let change = parseFloat(response.data.change.toFixed(2));
      let changePercent = "(" + (100 * response.data.changePercent).toFixed(2) + "%)";

      if (change < 0) {
        change = c.red(change);
        changePercent = c.red(changePercent);
      } else if (change > 0) {
        change = "+" + change;
        change = c.green(change);
        changePercent = c.green(changePercent);
      }

      event.reply(
        symbol +
          " | " +
          c.bold(companyName) +
          " | $" +
          latestPrice.toFixed(2) +
          " " +
          change +
          " " +
          changePercent +
          " | MCAP: $" +
          formattedMCAP(marketCap)
      );
    })
    .catch(error => {
      event.reply('Error finding stock.');
    });
}

// Reddit parsing plugin
// TODO: Move it into its own file
async function reddit(event) {
  const to_join = event.message.split(" ");
  let i;

  for (i = 0; i < to_join.length; i++) {
    if (to_join[i].includes("reddit.com")) {
      if (!to_join[i].includes("http")) {
        to_join[i] = "https://" + to_join[i];
      }
      break;
    }
  }

  const query = to_join[i].split('?')[0] + ".json";
  await axios
    .get(query)
    .then(response => {
      const {
        subreddit_name_prefixed,
        title
      } = response.data[0].data.children[0].data;

      const { id, body } = response.data[1].data.children[0].data;
      const commentIDSize = 7;
      const commentIDFromURL = to_join[i]
        .replace(/\/$/, "")
        .slice(-commentIDSize);

      let parsedTitle = he.decode(title);
      let subreddit = c.bold(subreddit_name_prefixed);

      if (commentIDFromURL === id) {
        const commentLength = 330 - subreddit_name_prefixed.length;
        const commentBody = he.decode(body.replace(/\r?\n|\r/g, " ").substring(0, commentLength));

        let comment = '"' + commentBody;

        if (body.length > commentLength) {
          comment = comment + "...";
        }

        comment = comment + '"';
        for (let i = 0; i < censoredStrings.length; i++) {
          if (comment.includes(censoredStrings[i])) {
            return;
          }
        }
        event.reply(subreddit + " | " + comment);
      } else {
        for (let i = 0; i < censoredStrings.length; i++) {
          if (parsedTitle.includes(censoredStrings[i])) {
            return;
          }
        }
        event.reply(subreddit + " | " + parsedTitle);
      }
    })

    .catch(error => {
      console.log(error);
    });
}

// Helper function for stock plugin to attach (K, M, B, T) to the market cap
function formattedMCAP(num) {
  if (num === null) {
    return null;
  }
  if (num === 0) {
    return "0";
  }
  let fixed = 1;
  const b = num.toPrecision(2).split("e"),
    k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3),
    c =
      k < 1
        ? num.toFixed(fixed)
        : (num / Math.pow(10, k * 3)).toFixed(1 + fixed),
    d = c < 0 ? c : Math.abs(c),
    e = d + ["", "K", "M", "B", "T"][k];
  return e;
}

async function gameprices (event) {

  const game = event.message.replace("!gp ", "");
  let ITAD_API_KEY = process.env.ITAD_API_KEY;
  console.log(game);
  const query = "https://api.isthereanydeal.com/v01/search/search/?key=" + ITAD_API_KEY + "&q=" + game + "&region=us&limit=60&country=us";
  //console.log(query);
  await axios
      .get(query)
      .then(response => {
        let price = response.data.data.list[0].price_new;
        let gameName = response.data.data.list[0].title;
        let shopName = response.data.data.list[0].shop.name;
        let DRM = response.data.data.list[0].drm;
        event.reply(gameName + " - $" + price + " @ " + shopName);
      })
      .catch(error => {
        event.reply('Error finding game.');
      });
}