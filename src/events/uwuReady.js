const Event = require("../structures/Event.js");
const { ActivityType } = require("discord.js");

class ReadyEvent extends Event {
  async run() {
    const { user, log } = this.client;
    const guilds = await this.client.getGuildCount();

    log.info(`Logged in as ${user.tag} (${user.id})`);
    log.info(`Bot is in ${guilds} servers.`);

    await this.client.user.setActivity(`uwu help | ${guilds} servers`, {
      type: ActivityType.Playing
    });
  }
}

module.exports = ReadyEvent;
