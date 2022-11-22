require("dotenv").config();

const UwUClient = require("./structures/UwUClient.js");

const client = new UwUClient();
client.login();
