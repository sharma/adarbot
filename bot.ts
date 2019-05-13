const IRC = require('irc-framework');
const axios = require('axios');
const bot = new IRC.Client();
const c = require('irc-colors');

bot.connect({
	host: 'irc.synirc.net',
	port: 6667,
	nick: 'stockbot'
});

bot.on('registered', function(event) {
    bot.join('#cobol');
});

bot.on('message', function(event) {
    if (event.message.match(/^\,st(ock)?/)) {
        var to_join = event.message.split(' ');
        var query = 'https://cloud.iexapis.com/stable/stock/' + to_join[1] + '/quote';
        axios.get(query, {
          params: {
            token: process.env.API_KEY
            }
        })
        .then(function (response) {

          var change;
          var changePercent;
          if (response.data.change < 0) {
            change = c.red(response.data.change.toFixed(2));
            changePercent = c.red("(" + (100 * response.data.changePercent.toFixed(4)) + "%)");
          }
          else if (response.data.change > 0) {
            change = c.green("+" + response.data.change.toFixed(2));
            changePercent = c.green("(+" + (100 * response.data.changePercent.toFixed(4)) + "%)");
          }
          else {
            change = response.data.change.toFixed(2);
            changePercent = "(" + (100 * response.data.changePercent.toFixed(4)) + "%)";
          }
          event.reply(
            response.data.symbol + 
          " | " + c.bold(response.data.companyName) + 
          " | $" + response.data.latestPrice.toFixed(2) + 
          " " + change + 
          " " + changePercent +  
          " | MCAP: $" + formattedMCAP(response.data.marketCap));
        });
    }
});

function formattedMCAP(num) {
  if (num === null) { return null; } // terminate early
  if (num === 0) { return '0'; } // terminate early
  var fixed = (!fixed || fixed < 0) ? 1 : fixed; // number of decimal places to show
  var b = (num).toPrecision(2).split("e"), // get power
      k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
      c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(1 + fixed), // divide by power
      d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
      e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
  return e;
}