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

    let subreddit = c.bold(cleanText(subreddit_name_prefixed, 100));

    let reply;
    if (isComment(url, payload)) {
        let { body, author } = payload[1].data.children[0].data;
        author = cleanText(author, 100);
        const length = 330 - (author.length + subreddit.length + 1);
        body = he.decode(cleanText(body, length));

        reply = `${subreddit} | "${body}" — /u/${author}`;
    } else {
        const length = 330 - (subreddit.length + 1);
        let parsedTitle = he.decode(cleanText(title, length));
        reply = `${subreddit} | ${parsedTitle}`;
    }

    const lowercaseReply = reply.toLowerCase();
    if (censoredStrings.some(s => lowercaseReply.includes(s.toLowerCase()))) {
        console.log(`bad content: ${reply}`);
        return;
    }

    event.reply(reply);
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

function truncateStringToByteSize(s, n) {
    let b = Buffer.from(s);
    if (b.length <= n) {
        return s;
    }
    if (n <= 3) {
      return '...';
    }

    b = b.slice(0, n - 3);
    // don't truncate in the middle of a utf-8 codepoint
    let i, r;
    for (i = 1; i < b.length; ++i) {
        const c = b[b.length-i];
        if (c < 0b1000_0000) {
            // ascii byte, ok
            r = 1;
        } else if (c < 0b1100_0000) {
            // continuation byte, continue
            continue;
        } else if (c < 0b1110_0000) {
            // start of a 2-byte codepoint
            r = 2;
        } else if (c < 0b1111_0000) {
            r = 3
        } else {
            r = 4
        }
        break;
    }
    if (r !== i) {
        // suffix can't be a complete codepoint, so drop it
        b = b.slice(0, b.length - i);
    }
    return b.toString() + '...';
}

function cleanText(s, maxSize = null) {
    s = s.replace(/[\x00-\x20]+/g, ' ');
    if (maxSize) {
        s = truncateStringToByteSize(s, maxSize);
    }
    return s;
}
