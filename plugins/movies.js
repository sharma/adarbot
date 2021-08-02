const axios = require("axios");
const c = require("irc-colors");
const OMDB_API_KEY = process.env.OMDB_API_KEY;

module.exports.search = async function search(event) {
    const movieTitle = event.message.replace(",rt ", "");
    const movieQuery = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${movieTitle}`;

    await axios
        .get(movieQuery)
        .then(async response => {
            let {
                Title,
                Year,
                Plot
            } = response.data;
            let rtScore = c.bold(response.data.Ratings[1].Value);
            event.reply(`${event.nick}: ${Title} (${Year}) | RT Score: ${rtScore} | Plot: ${Plot}`);
        })
        .catch(error => {
            console.log(error);
            event.reply(event.nick + ": Couldn't find a RT score. It might not be in the database yet.");
            });
}