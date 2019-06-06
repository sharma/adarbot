const IRC = require('irc-framework');
const axios = require('axios');
const c = require('irc-colors');
const he = require('he');
require('dotenv').config();
require('colors');

const bot = new IRC.Client();

bot.connect({
  host: 'irc.synirc.net',
  port: 6667,
  nick: 'adarbot',
  username: 'adar'
});

bot.on('close', function() { console.log('Connection closed.'); });

bot.on('registered', function(event) {
  bot.say('nickserv', 'identify ' + process.env.NICKSERV_PASS);
  bot.join('#adarbot');
  bot.join("#cobol");
});

bot.on('message', function(event) {
  console.log("<" + event.nick.bold.green + "> " + event.message)
  
  if (event.message.match(/^\,st(ock)?/)) {
    stocks(event);
  }
  if (event.message.match(/reddit.com/)) {
    reddit(event);
  }
});

function stocks(event) {
  const to_join = event.message.split(' ');
  const query = 'https://cloud.iexapis.com/stable/stock/' + to_join[1] + '/quote';
  axios.get(query, {
    params: {
      token: process.env.IEX_API_KEY
    }
  })
  .then(function(response) {
    let {change, changePercent, companyName, symbol, latestPrice, marketCap} = response.data;
    change = parseFloat(response.data.change.toFixed(2));
    changePercent = "(" + (100 * response.data.changePercent).toFixed(2) + "%)";

    if (change < 0) {
      change = c.red(change);
      changePercent = c.red(changePercent);
    }
    else if (change > 0) {
      change = c.green(change);
      changePercent = c.green(changePercent);
    }

    event.reply(
      symbol + 
      " | " + c.bold(companyName) + 
      " | $" + latestPrice.toFixed(2) + 
      " " + change + 
      " " + changePercent +  
      " | MCAP: $" + formattedMCAP(marketCap)
    );
  })
  .catch(function(error) {
    console.log(error);
  });
}

function reddit(event) {
  const to_join = event.message.split(' ');
  let i;

  for (i = 0; i < to_join.length; i++) {
    if (to_join[i].includes('reddit.com')) { 
      break; 
    }
  }

  if (to_join[i]) {
    if (!to_join[i].includes('http')) { 
      to_join[i] = 'https://' + to_join[i]; 
    }
  }

  const query = to_join[i] + '.json'
  axios.get(query)
  .then(function (response) {
    const { title, num_comments, upvote_ratio } = response.data[0].data.children[0].data;
    let parsedTitle = he.decode(title);
    let ratio = upvote_ratio * 100;
    
    if (ratio >=80) { ratio = c.green(ratio + "%"); }
    else if (ratio >= 60) { ratio = c.yellow(ratio + "%"); }
    else {ratio = c.red(ratio + "%")};

    event.reply(
      c.bold('reddit') + 
      " | " + parsedTitle +
      " | Comments: " + num_comments +
      " | Ratio: " + ratio
    );
  })

  .catch(function (error) {
    console.log(error);
  });
}

function formattedMCAP(num) {
  if (num === null) { return null; } 
  if (num === 0) { return '0'; } 
  let fixed = 1; 
  const b = (num).toPrecision(2).split("e"), 
      k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), 
      c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(1 + fixed), 
      d = c < 0 ? c : Math.abs(c), 
      e = d + ['', 'K', 'M', 'B', 'T'][k]; 
  return e;
}
