require("dotenv").config();

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");
const { TOKEN_DEV, TOKEN, DEV, CLIENT_ID } = process.env;

const rest = new REST({ version: "10" }).setToken(DEV ? TOKEN_DEV : TOKEN);

const UwUClient = require("./structures/UwUClient");

// Create a client but do not log in, just for loading commands.
const client = new UwUClient();

async function main() {
  await client.load();
  const body = [];

  for (const command of client.commands.values()) {
    if (
      command.modes.includes("slash") &&
      command.enabled &&
      !command.nsfw &&
      !command.devOnly
    ) {
      body.push(command.getSlashCommandData().toJSON());
    }
  }

  await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
  console.log(`Successfully registered ${body.length} application commands.`);
}

main();
