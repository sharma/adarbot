const axios = require("axios");
const OCD_API_KEY = process.env.OCD_API_KEY;
const CLIMACELL_API_KEY = process.env.CLIMACELL_API_KEY;

module.exports.search = async function lookup(event) {
    let dontsave = 0;

    if (event.message.includes("dontsave")) {
        dontsave = 1;
    }
    let splitMessage = event.message;
    splitMessage = splitMessage.replace(",we ", "").replace(" dontsave", "");

    const geoQuery = `https://api.opencagedata.com/geocode/v1/json?key=${OCD_API_KEY}&q=${splitMessage}&pretty=1`;
    let {
        lat,
        lng,
        formattedLocation
    } = "";

    await axios
        .get(geoQuery)
        .then(async response => {
             lat = response.data.results[0].geometry.lat;
             lng = response.data.results[0].geometry.lng;
             formattedLocation = response.data.results[0].formatted;

        })
        .catch(error => {
            console.log(error);
            event.reply(event.nick + ": Could not find location.");
            return;
        });

    const query = `https://api.climacell.co/v3/weather/realtime?lat=${lat}&lon=${lng}&fields=temp%2Chumidity%2Cwind_speed%2Cprecipitation_type%2Cepa_health_concern&apikey=${CLIMACELL_API_KEY}`;

    await axios
        .get(query)
        .then(response => {
            const tempC = parseFloat(response.data.temp.value).toFixed(1);
            const tempF = ((tempC) * (9/5) + 32).toFixed(1);
            const humidity = response.data.humidity.value.toFixed(0);
            const wind_speedKM = parseFloat(response.data.wind_speed.value).toFixed(1);
            const wind_speedM = ((wind_speedKM) / 1.6).toFixed(1);
            const air_quality = response.data.epa_health_concern.value;
            const precipitation = response.data.precipitation_type.value;

            event.reply(`${event.nick}: ${formattedLocation} | ${tempF}F/${tempC}C | Precipitation: ${precipitation} | Humidity: ${humidity}% | Wind Speed: ${wind_speedM}mph/${wind_speedKM}kmph | Air Quality: ${air_quality}`);
        })
        .catch(error => {
            console.log(error);
            event.reply(event.nick + ": No weather found for location.");
        })
}

