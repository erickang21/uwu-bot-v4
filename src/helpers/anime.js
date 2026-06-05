const { request } = require("undici");
const { get } = require("./api");
const translate = require("./translate");
const utils = require("../utils/utils.js");

const NEKOS_BEST_USER_AGENT = "uwu-bot/4.0-alpha (https://github.com/erickang21/uwu-bot-v4)";

const NEKOS_BEST_ENDPOINTS = new Set([
    "lurk", "shoot", "sleep", "clap", "shrug", "stare", "wave", "poke", "confused",
    "smile", "peck", "wink", "sip", "blush", "smug", "tickle", "yeet", "think",
    "highfive", "feed", "wag", "bite", "teehee", "shocked", "bleh", "bored", "nom",
    "nya", "yawn", "facepalm", "cuddle", "kick", "happy", "carry", "hug", "kabedon",
    "baka", "bonk", "pat", "angry", "spin", "shake", "run", "nod", "nope", "kiss",
    "dance", "punch", "handshake", "slap", "cry", "lappillow", "pout", "blowkiss",
    "handhold", "salute", "thumbsup", "laugh", "tableflip", "neko", "waifu",
    "husbando", "kitsune",
]);

const NEKOS_BEST_FALLBACKS = {
    bully: "pout",
    lick: "peck",
    cringe: "confused",
    holdhand: "handhold",
};

function resolveNekosBestEndpoint(endpoint) {
    if (NEKOS_BEST_ENDPOINTS.has(endpoint)) return endpoint;
    if (NEKOS_BEST_FALLBACKS[endpoint]) return NEKOS_BEST_FALLBACKS[endpoint];
    return "hug";
}

async function getNekosBestAPI(endpoint) {
    const resolved = resolveNekosBestEndpoint(endpoint);
    try {
        const { statusCode, body } = await request(`https://nekos.best/api/v2/${resolved}`, {
            headers: { "User-Agent": NEKOS_BEST_USER_AGENT },
        });
        const text = await body.text();
        if (statusCode !== 200) {
            console.log("NekosBest API Error:", statusCode, text);
            return { url: null, animeName: null };
        }
        let res;
        try {
            res = JSON.parse(text);
        } catch {
            console.log("NekosBest API Error: invalid JSON response", text);
            return { url: null, animeName: null };
        }
        if (!res?.results?.[0]?.url) {
            console.log("NekosBest API Error:", res);
            return { url: null, animeName: null };
        }
        const { url, anime_name: animeName } = res.results[0];
        return { url, animeName };
    } catch (error) {
        console.log("NekosBest API Error:", error.message);
        return { url: null, animeName: null };
    }
}

async function waifuAPI(endpoint) {
    const res = await get(`https://api.waifu.pics/sfw/${endpoint}`);
    if (!res.url) {
        console.log("Waifu API Error: ", res);
        throw translate("error.api");
    }
    return res.url;
}

async function nekoAPI(endpoint) {
    const res = await get(`https://nekos.life/api/v2/img/${endpoint}`);
    if (!res.url) {
        console.log("Neko API Error: ",res);
        throw translate("error.api");
    }
    return res.url;
}

async function otakuAPI(endpoint) {
    const res = await get(`https://api.otakugifs.xyz/gif?reaction=${endpoint}`);
    if (!res.url) {
        console.log("Otaku API Error: ",res);
        throw translate("error.api");
    }
    return res.url;
}

async function gelbooruAPI(tags) {
    const bannedTags = ["loli", "shota", "child", "young"];
    const defaultTags = ["rating:explicit"];
    const allTags = [...bannedTags.map(tag => `-${tag}`), ...defaultTags, ...tags];
    const tagString = allTags.join("%20");
    const res = await get(`https://gelbooru.com/index.php?page=dapi&api_key=${process.env.GELBOORU_API}&user_id=${process.env.GELBOORU_USER_ID}&s=post&q=index&json=1&tags=${tagString}`);
    if (!res?.['@attributes']) {
        console.log("Gelbooru API Error: ",res);
        throw translate("error.api");
    }
    const urls = res.post.map((entry) => entry.sample_url.replace("/samples", "//samples"))
    return utils.random(urls);
}

module.exports = { waifuAPI, nekoAPI, otakuAPI, gelbooruAPI, getNekosBestAPI };
