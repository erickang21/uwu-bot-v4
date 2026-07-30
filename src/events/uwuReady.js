const Event = require("../structures/Event.js");

const FLUSH_INTERVAL_MS = 60000;
const SNAPSHOT_INTERVAL_MS = 3600000;
const RESOURCE_SAMPLE_INTERVAL_MS = 60000;

class ReadyEvent extends Event {
  get isAnalyticsCoordinator() {
    return !this.client.shard || this.client.shard.ids[0] === 0;
  }

  async run() {
    const { user, log } = this.client;

    // Every shard samples its own CPU and memory; the coordinator collects them.
    this.client.analyticsManager.resourceSample();
    setInterval(
      () => this.client.analyticsManager.resourceSample(),
      RESOURCE_SAMPLE_INTERVAL_MS
    );

    if (this.isAnalyticsCoordinator) {
      await this.startAnalyticsCoordinator();
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

  /**
   * Runs on one shard only: index setup, draining every shard's metric buffer,
   * and the authoritative fleet snapshot.
   */
  async startAnalyticsCoordinator() {
    const { analyticsManager, log } = this.client;

    try {
      await analyticsManager.ensureIndexes();
    } catch (error) {
      log.error(`[Analytics] Failed to prepare indexes: ${error}`);
    }

    await this.flushMetrics();
    setInterval(() => this.flushMetrics(), FLUSH_INTERVAL_MS);

    await this.snapshotFleet();
    setInterval(() => this.snapshotFleet(), SNAPSHOT_INTERVAL_MS);
  }

  async flushMetrics() {
    try {
      await this.client.analyticsManager.collect();
    } catch (error) {
      this.client.log.error(`[Analytics] Failed to flush metrics: ${error}`);
    }
  }

  async snapshotFleet() {
    try {
      const stats = await this.client.getFleetStats();
      await this.client.analyticsManager.snapshotFleet(stats);
      this.client.log.debug(
        `[Analytics] Fleet snapshot: ${stats.totalServers} servers, ${stats.totalMembers} members.`
      );
    } catch (error) {
      this.client.log.error(`[Analytics] Failed to snapshot fleet: ${error}`);
    }
  }
}

module.exports = ReadyEvent;
