const axios = require("axios");
const c = require("irc-colors");
const he = require("he");

const PATTERN = module.exports.PATTERN =
    /(?<!\S)(?:https:\/\/)?(?:www\.)?reddit\.com\/\S*/;

module.exports = { hasLink, summarizeLinks };

function hasLink(message) {
    return PATTERN.test(message);
}

async function summarizeLinks(event, censoredStrings) {
    try {
        return await summarizeLinksInner(event, censoredStrings);
    } catch (err) {
        console.log("reddit.summarizeLinks() failed: ", err);
    }
}

async function summarizeLinksInner(event, censoredStrings) {
    const matches = event.message.match(PATTERN);
    if (!matches.length) {
        return;
    }

    const url = matches[0].split('?')[0];
    const response = await axios.get(url + '.json');
    const payload = response.data;

    if (!Array.isArray(payload) || payload.length != 2
        || payload[0].data.children.length != 1
        || payload[0].data.children[0].kind != 't3') {
        return;
    }

    const {
        subreddit_name_prefixed,
        title
    } = payload[0].data.children[0].data;

    let parsedTitle = he.decode(title.replace(/\r?\n|\r/g, " "));
    let subreddit = c.bold(subreddit_name_prefixed.replace(/\r?\n|\r/g, " "));

    if (isComment(url, payload)) {
        const { body, author } = payload[1].data.children[0].data;
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
}

function isComment(url, payload) {
    if (payload[1].data.children.length != 1) {
        return false;
    }

    const comment = payload[1].data.children[0];
    if (comment.kind != "t1") {
        return false;
    }
    const data = comment.data;

    if (typeof data.id != "string" || data.id.length == 0) {
        return false;
    }

    return url.endsWith(data.id) || url.endsWith(data.id + '/');
}
