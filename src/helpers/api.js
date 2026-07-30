const { request } = require("undici");
const translate = require("./translate");
const { ApiError } = require("../utils/errors.js");
const { apiNameFor } = require("./apiMetrics.js");

async function get(url, options) {
  try {
    const response = await request(url, options).then(
      ({ body }) => body.json()
    );
    return response;
  } catch (error) {
    console.error(error);
    throw new ApiError(translate("error.api"), apiNameFor(url));
  }
  
}

module.exports = {
  get
};