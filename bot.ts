const IRC = require('irc-framework');
const axios = require('axios');
const bot = new IRC.Client();

bot.connect({
	host: 'irc.synirc.net',
	port: 6667,
	nick: 'stockbot'
});

bot.on('registered', function(event) {
    bot.join('#stockbot');
});

bot.on('message', function(event) {
    if (event.message.match(/^\.st(ock)?/)) {
        var to_join = event.message.split(' ');
        axios.get('https://www.alphavantage.co/query', {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: to_join[1],
                apikey: process.env.API_KEY
            }
        })
        .then(function (response) {
            var symbol = response.data["Global Quote"]["01. symbol"];
            var open = response.data["Global Quote"]["02. open"]
            var high = response.data["Global Quote"]["03. high"]
            var low = response.data["Global Quote"]["04. low"]
            var price = response.data["Global Quote"]["05. price"];
           
            event.reply("Symbol: " + symbol + ", Price: " + price);
            console.log(response.data);
        });
    }
});