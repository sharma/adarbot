const IRC = require('irc-framework');
const axios = require('axios');
const bot = new IRC.Client();

bot.connect({
	host: 'irc.synirc.net',
	port: 6667,
	nick: 'stockbot'
});

bot.on('registered', function(event) {
    bot.join('#cobol');
});

bot.on('message', function(event) {
    if (event.message.match(/^\.st(ock)?/)) {
        var to_join = event.message.split(' ');
        var query = 'https://cloud.iexapis.com/stable/stock/' + to_join[1] + '/quote';
        axios.get(query, {
            params: {
                token: process.env.API_KEY
            }
        })
        .then(function (response) {
            console.log(response.data.open);
            var mcap = response.data.marketCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            event.reply("Symbol: " + response.data.symbol + " | Price: $" + response.data.latestPrice + " | Change: $" + response.data.change + " | P/E: " + response.data.peRatio + " | MCAP: $" + mcap);
        });
    }
});