const { get } = require("./api");
const translate = require("./translate");

async function waifuAPI(endpoint) {
    const { url } = await get(`https://api.waifu.pics/sfw/${endpoint}`);
    if (!url) throw translate("error.api");
    return url;
}

async function nekoAPI(endpoint) {
    const { url } = await get(`https://nekos.life/api/v2/img/${endpoint}`);
    if (!url) throw translate("error.api");
    return url;
}

module.exports = {
    waifuAPI,
    nekoAPI
}
