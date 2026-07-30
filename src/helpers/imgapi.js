const { request } = require("undici");
const { stringify } = require("querystring");

// The upstream img-api client reads the response content-type with
// res.getHeader(), a method that only exists on outgoing messages. On any
// non-200 response it throws TypeError inside the "end" handler, uncaught and
// off the awaited promise, crashing the shard. Replace the request path with an
// undici implementation (per NOTES.md) that reads res.headers correctly and
// rejects, so the caller's try/catch can handle it.
function patchImgapiClient(client) {
  client._get = async function (endpoint, query = {}) {
    const headers = {};
    if (this.password) headers.Authorization = this.password;

    const url = `http://${this.host}:${this.port}${endpoint}?${stringify(query)}`;
    const { statusCode, headers: resHeaders, body } = await request(url, { headers });
    const buffer = Buffer.from(await body.arrayBuffer());

    if (statusCode !== 200) {
      const contentType = resHeaders["content-type"] || "";
      if (contentType.includes("application/json"))
        throw new Error(JSON.parse(buffer.toString()).message);
      throw new Error(`${statusCode}: request to ${endpoint} failed`);
    }

    return buffer;
  };

  return client;
}

module.exports = { patchImgapiClient };
