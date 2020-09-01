const axios = require("axios");

module.exports.search = async function search(event) {

  const splitMessage = event.message.replace(",oc ", "");
  const gameIDQuery = "https://api.opencritic.com/api/game/search?criteria=" + splitMessage;
  let gameID ="";
  let returnResults = "";

  await axios
    .get(gameIDQuery)
    .then(response => {
      gameID = response.data[0].id;
      console.log("Query: " + splitMessage + " | Game ID: " + gameID);
    })
    .catch(error => {
      event.reply("No results.")
    });

  let gameReviewQuery = "https://api.opencritic.com/api/game/" + gameID;
  await axios
    .get(gameReviewQuery)
    .then(response => {

    })

}