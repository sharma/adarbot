const axios = require("axios");
const c = require("irc-colors");

module.exports.search = async function stocks(event) {
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

            let change = "N/A";
            let changePercent="(N/A%)";

            if (response.data.change && response.data.changePercent != null) {
                change = parseFloat(response.data.change.toFixed(2));
                changePercent = "(" + (100 * response.data.changePercent).toFixed(2) + "%)";
            }

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
            console.log(error);
            event.reply("Error finding stock.");
        });
}

// Helper function for stock plugin to attach (K, M, B, T) to the market cap
function formattedMCAP(num) {
    if (num === null) {
        return "N/A";
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