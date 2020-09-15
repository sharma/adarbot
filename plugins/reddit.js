const axios = require("axios");
const c = require("irc-colors");
const he = require("he");

module.exports.parse = async function reddit(event, censoredStrings) {
    const to_join = event.message.split(" ");
    let i;

    for (i = 0; i < to_join.length; i++) {
        if (to_join[i].includes("reddit.com")) {
            if (!to_join[i].includes("http")) {
                to_join[i] = "https://" + to_join[i];
            }
            break;
        }
    }

    const query = to_join[i].split('?')[0] + ".json";
    await axios
        .get(query)
        .then(response => {
            const {
                subreddit_name_prefixed,
                title
            } = response.data[0].data.children[0].data;

            const { id, body, author } = response.data[1].data.children[0].data;
            const commentIDSize = 7;
            const commentIDFromURL = to_join[i]
                .replace(/\/$/, "")
                .slice(-commentIDSize);

            let parsedTitle = he.decode(title);
            let subreddit = c.bold(subreddit_name_prefixed);

            if (commentIDFromURL === id) {
                const commentLength = 330 - (author.length + subreddit_name_prefixed.length + 1);
                const commentBody = he.decode(body.replace(/\r?\n|\r/g, " ").substring(0, commentLength));

                let comment = '"' + commentBody;

                if (body.length > commentLength) {
                    comment = comment + "...";
                }

                comment = comment + '"';
                for (let i = 0; i < (censoredStrings.length + 3); i++) {
                    if (comment.includes(censoredStrings[i])) {
                        return;
                    }
                }
                event.reply(subreddit + " | " + comment + ` — /u/${author}`);
            } else {
                for (let i = 0; i < censoredStrings.length; i++) {
                    if (parsedTitle.includes(censoredStrings[i])) {
                        return;
                    }
                }
                event.reply(subreddit + " | " + parsedTitle);
            }
        })

        .catch(error => {
            console.log(error);
        });
}