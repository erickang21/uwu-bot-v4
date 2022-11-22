import {
	Client,
	Events,
	GatewayIntentBits,
	SlashCommandBuilder,
} from "discord.js";
const { token } = require("../config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(token);
