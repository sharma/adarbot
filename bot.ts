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
            var mcap = response.data.marketCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            var change;
            if (response.data.change < 0) {
              change = c.red(response.data.change.toFixed(2));
            }
            else if (response.data.change > 0) {
              change = c.green(response.data.change.toFixed(2));
            }
            else {
              change = response.data.change.toFixed(2);
            }
            event.reply(response.data.symbol + 
            " | " + c.bold(response.data.companyName) + 
            " | Price: " + response.data.latestPrice.toFixed(2) + 
            " | Change: " + change + 
            " (" + response.data.changePercent.toFixed(2) +  
            "%) | P/E: " + response.data.peRatio + 
            " | MCAP: $" + mcap);
        });
    }
});
