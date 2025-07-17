const { request } = require("undici");
const translate = require("./translate");

async function get(url, options) {
  try {
    const response = await request(url, options).then(
      ({ body }) => body.json()
    );
    return response;
  } catch (error) {
    console.error(error);
    throw translate("error.api");
  }
  
}

module.exports = {
  get
};