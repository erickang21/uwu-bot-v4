const Event = require("../structures/Event.js");

class ReadyEvent extends Event {
  async run() {
    const { user, log } = this.client;

    // Periodically merge and save command analytics.
    if (this.client.shard?.ids[0] === 0) {
      setInterval(async () => {
        // returns:
        // [{ usage: { ...}, count: 123}, { usage: {...}, count: 456}...]
        const allUsage = await this.client.shard.broadcastEval((client) => {
          return { usage: client.analyticsManager.commandUsage, slashCount: client.analyticsManager.slashCommandCount, textCount: client.analyticsManager.textCommandCount };
        });
    
        const mergedUsage = allUsage.reduce((acc, shardUsage) => {
          for (const [cmd, count] of Object.entries(shardUsage.usage)) {
            acc[cmd] = (acc[cmd] ?? 0) + count;
          }
          return acc;
        }, {});

        const mergedSlashCount = allUsage.reduce((acc, shardUsage) => {
          return acc + shardUsage.slashCount;
        }, 0);
        const mergedTextCount = allUsage.reduce((acc, shardUsage) => {
          return acc + shardUsage.textCount;
        }, 0);
    
        await this.client.analyticsManager.saveCommandUses(mergedUsage, mergedSlashCount, mergedTextCount);
        // Once done, reset command usage on all shards.
        await this.client.shard.broadcastEval((client) => {
          client.analyticsManager.resetCommandUsage();
        });
    
      }, 60000);
    }
    //const guilds = await this.client.getGuildCount();
    /*
    const serverCount = this.client.guilds.cache.size;
    const shardId = this.client.shard.ids[0];
    try {
      if (!this.client.dev) {
        this.stats = setInterval(() => this.client.postStats(), 300000);
      }
      log.info(`Posted to Top.gg. Shard: ${shardId} | Servers: ${serverCount}`);
    } catch (err) {
      log.error(`An error occurred posting to top.gg:\n\n${err}`);
    }
    */
    log.info(`Logged in as ${user.tag} (${user.id})`);
    let count = 0;
    for (const id of this.client.settings.guilds.cache.keys()) {
      if (!this.client.guilds.cache.has(id)) {
        this.client.settings.guilds.cache.delete(id);
        count++;
      }
    }
    log.info(`Removed ${count} unnecessary GUILD entries in cache.`)
    //log.info(`Bot is in ${guilds} servers.`);
    //this.client.setActivity();
    
  }
}

module.exports = ReadyEvent;
