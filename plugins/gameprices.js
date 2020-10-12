const axios = require("axios");
const c = require("irc-colors");

module.exports.search = async function gameprices(event) {

  let game = event.message.replace(",gp ", "");
  game = encodeURIComponent(game);
  let { price, gameName, shopName } = "";
  let continueSearch = 0;
  const ITAD_API_KEY = process.env.ITAD_API_KEY;
  const query = `https://api.isthereanydeal.com/v02/search/search/?key=${ITAD_API_KEY}&q=${game}&country=US`;
  await axios
    .get(query)
    .then(response => {
      plain = response.data.data.results[0].plain;
      console.log(plain);
      gameName = response.data.data.results[0].title;
      continueSearch = 1;
    })
    .catch(error => {
      console.log(error);
      event.reply(event.nick + ": Error finding game.");
    });

  if (continueSearch === 0) {
    return;
  }

const query2 = `https://api.isthereanydeal.com/v01/game/prices/?key=${ITAD_API_KEY}&plains=${plain}&country=US`;

await axios
  .get(query2)
  .then(response => {
    price = response.data.data[plain].list[0].price_new;
    shopName = response.data.data[plain].list[0].shop.name;
    event.reply(event.nick + ": " + c.bold(gameName) + " - $" + price + " @ " + c.bold(shopName));
  })
  .catch(error => {
    console.log(error);
    event.reply(event.nick + ": Error determining game price.");
    return;
  })    
}
