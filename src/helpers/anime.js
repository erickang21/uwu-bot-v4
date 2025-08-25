const { get } = require("./api");
const translate = require("./translate");

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
    if (!res.post) {
        console.log("Gelbooru API Error: ",res);
        throw translate("error.api");
    }
    return res.post;
}

module.exports = {
    waifuAPI,
    nekoAPI,
    otakuAPI,
    gelbooruAPI,
}
