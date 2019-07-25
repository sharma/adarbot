const IRC = require("irc-framework");
const axios = require("axios");
const c = require("irc-colors");
const he = require("he");
require("dotenv").config();
require("colors");

const bot = new IRC.Client();
let {
  IRC_HOST,
  IRC_PORT,
  IRC_NICK,
  IRC_USERNAME,
  IRC_CHANNEL,
  NICKSERV_PASS
} = process.env;
let ignoredNicks = ["skybot", "buttebot"];
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
]

bot.connect({
  host: IRC_HOST,
  port: IRC_PORT,
  nick: IRC_NICK,
  username: IRC_USERNAME
});

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

  if (ignoredNicks.includes(event.nick)) {
    return;
  }
  if (event.message.match(/capitalism/) && event.nick.match(/charisma/)) {
    event.reply("shut up charismama");
  }
  if (event.message.match(/^\,st(ock)?/)) {
    stocks(event);
  }
  if (event.message.match(/reddit.com/)) {
    reddit(event);
  }
});

function stocks(event) {
  const to_join = event.message.split(" ");
  const query =
    "https://cloud.iexapis.com/stable/stock/" + to_join[1] + "/quote";
  axios
    .get(query, {
      params: {
        token: process.env.IEX_API_KEY
      }
    })
    .then(response => {
      let {
        change,
        changePercent,
        companyName,
        symbol,
        latestPrice,
        marketCap
      } = response.data;
      change = parseFloat(response.data.change.toFixed(2));
      if (change > 0) {
        change = '+' + change;
      }
      changePercent =
        "(" + (100 * response.data.changePercent).toFixed(2) + "%)";

      if (change < 0) {
        change = c.red(change);
        changePercent = c.red(changePercent);
      } else if (change > 0) {
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
      console.log(error);
    });
}

function reddit(event) {
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

  const query = to_join[i] + ".json";
  axios
    .get(query)
    .then(response => {
      const {
        subreddit_name_prefixed,
        title,
        num_comments,
        upvote_ratio
      } = response.data[0].data.children[0].data;

      const { id, body } = response.data[1].data.children[0].data;
      const commentIDSize = 7;
      const commentIDFromURL = to_join[i]
        .replace(/\/$/, "")
        .slice(-commentIDSize);
      let parsedTitle = he.decode(title);
      let ratio = upvote_ratio * 100;
      let subreddit = c.bold(subreddit_name_prefixed);

      if (ratio >= 80) {
        ratio = c.green(ratio + "%");
      } else if (ratio >= 60) {
        ratio = c.yellow(ratio + "%");
      } else {
        ratio = c.red(ratio + "%");
      }

      if (commentIDFromURL === id) {
        const commentBody = he.decode(
          body.replace(/\r?\n|\r/g, " ").substring(0, 340)
        );
        let comment = '"' + commentBody;
        if (body.length > 340) {
          comment = comment + "...";
        }
        comment = comment + '"';
        for (let i = 0; i < censoredStrings.length; i++) {
          if (comment.includes(censoredStrings[i])) {
            return;
          }
        }
        event.reply(comment);
      } else {
        for (let i = 0; i < censoredStrings.length; i++) {
          if (parsedTitle.includes(censoredStrings[i])) {
            return;
        event.reply(
          subreddit +
            " | " +
            parsedTitle +
            " | Comments: " +
            num_comments +
            " | Ratio: " +
            ratio
        );
      }
    })

    .catch(error => {
      console.log(error);
    });
}

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
        ? num.toFixed(0 + fixed)
        : (num / Math.pow(10, k * 3)).toFixed(1 + fixed),
    d = c < 0 ? c : Math.abs(c),
    e = d + ["", "K", "M", "B", "T"][k];
  return e;
}
