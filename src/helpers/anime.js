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

module.exports = {
    waifuAPI,
    nekoAPI,
    otakuAPI,
}
