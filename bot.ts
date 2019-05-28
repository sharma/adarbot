const IRC = require('irc-framework');
const axios = require('axios');
const c = require('irc-colors');

const bot = new IRC.Client();

bot.connect({
	host: 'irc.synirc.net',
	port: 6667,
	nick: 'adarbot'
});

bot.on('registered', function(event) {
    bot.join('#adarbot');
});

// Stock market plugin
bot.on('message', function(event) {
  if (event.message.match(/^\,st(ock)?/)) {
    const to_join = event.message.split(' ');
    const query = 'https://cloud.iexapis.com/stable/stock/' + to_join[1] + '/quote';
    axios.get(query, {
      params: {
        token: process.env.API_KEY
      }
    })
    .then(function (response) {
      let change = response.data.change.toFixed(2);
      let changePercent = "(" + (100 * response.data.changePercent.toFixed(4)) + "%)";

      if (response.data.change < 0) {
        change = c.red(change);
        changePercent = c.red(changePercent);
      }
      else if (response.data.change > 0) {
        change = c.green(change);
        changePercent = c.green(changePercent);
      }

      event.reply(
        response.data.symbol + 
        " | " + c.bold(response.data.companyName) + 
        " | $" + response.data.latestPrice.toFixed(2) + 
        " " + change + 
        " " + changePercent +  
        " | MCAP: $" + formattedMCAP(response.data.marketCap)
      );
    });
  }
});

// Reddit URL parsing plugin
bot.on('message', function(event) {
  if (event.message.match(/reddit.com/)) {
    const to_join = event.message.split(' ');

    let i;
    for (i = 0; i < to_join.length; i++) {
      if (to_join[i].includes('reddit.com')) { break; }
    }

    if (to_join[i][0] != 'h') {
      to_join[i] = 'https://' + to_join[i];
    }

    const query = to_join[i] + '/.json'
    axios.get(query)

    .then(function (response) {

      let title = response.data[0].data.children[0].data.title;
      let upvotes = response.data[0].data.children[0].data.ups;
      let ratio = (response.data[0].data.children[0].data.upvote_ratio) * 100;

      if (ratio >=85) { ratio = c.green(ratio + "%"); }
      else if (ratio >= 60) { ratio = c.yellow(ratio + "%"); }
      else {ratio = c.red(ratio + "%")};

      event.reply(
        c.bold('reddit') + 
        " | " + title +
        " | Upvotes: " + upvotes +
        " | Upvote Ratio: " + ratio
      );
    })

    .catch(function (error) {
      console.log(error);
    });
  }
});


function formattedMCAP(num) {
  if (num === null) { return null
    console.log(to_join[i]);; } 
  if (num === 0) { return '0'; } 
  let fixed = 1; 
  const b = (num).toPrecision(2).split("e"), 
      k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), 
      c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(1 + fixed), 
      d = c < 0 ? c : Math.abs(c), 
      e = d + ['', 'K', 'M', 'B', 'T'][k]; 
  return e;
}
