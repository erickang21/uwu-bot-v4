const Event = require("../structures/Event.js");

class ReadyEvent extends Event {
  async run() {
    const { user, log } = this.client;
    const guilds = await this.client.getGuildCount();
    const serverCount = this.client.guilds.cache.size;
    const shardCount = this.client.shard.ids[0];
    try {
      await this.topgg.postStats({
        serverCount,
        shardCount
      });
      log.info(`Posted to Top.gg. Shard: ${shardCount} | Servers: ${serverCount}`);
    } catch (err) {
      log.error(`An error occurred posting to top.gg:\n\n${err}`);
    }

    log.info(`Logged in as ${user.tag} (${user.id})`);
    log.info(`Bot is in ${guilds} servers.`);
    this.client.setActivity();
    
  }
}

module.exports = ReadyEvent;
