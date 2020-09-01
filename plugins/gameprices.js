const axios = require("axios");

module.exports.search = async function gameprices(event) {

  const game = event.message.replace("!gp ", "");
  const ITAD_API_KEY = process.env.ITAD_API_KEY;
  const query = "https://api.isthereanydeal.com/v01/search/search/?key=" + ITAD_API_KEY + "&q=" + game + "&region=us&limit=60&country=us";
  await axios
    .get(query)
    .then(response => {
      let price = response.data.data.list[0].price_new;
      let gameName = response.data.data.list[0].title;
      let shopName = response.data.data.list[0].shop.name;
      //let DRM = response.data.data.list[0].drm;
      event.reply(event.nick + ": " + gameName + " - $" + price + " @ " + shopName);
    })
    .catch(error => {
      console.log(error);
      event.reply(event.nick + ": Error finding game.");
    });
}