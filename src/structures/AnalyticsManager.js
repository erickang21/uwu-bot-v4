const { DateTime } = require("luxon");
const os = require("node:os");
const MetricBuffer = require("./MetricBuffer.js");
const {
  DAILY_RETENTION_DAYS,
  LATENCY_BUCKETS,
  METRIC_TYPES,
  UNIQUE_SETS,
  ERROR_KINDS,
  getSizeRange,
  getLatencyBucket,
  bucketIndex
} = require("../utils/analytics.js");

// The pre-refactor `analytics` collection is left untouched: its day keys are
// host-local rather than UTC and its category counters were inflated by a flush
// bug, so mixing that data into these documents would corrupt the new series.
const COLLECTION = "metrics";
const UNIQUE_COLLECTION = "metrics_unique";
const MS_PER_DAY = 86400000;

/**
 * Records and reads the bot's analytics.
 *
 * Two document families live in the `metrics` collection:
 *
 *   daily     { _id: { type, date, ...dimensions } } -> counters + `expiresAt`
 *   lifetime  { _id: { type: `${type}Total`, ...dimensions } } -> counters
 *
 * Only daily documents carry `expiresAt`, and the TTL index keys off that field
 * alone, so lifetime totals are never reaped. `METRIC_TYPES` maps each daily
 * type to its lifetime counterpart (or null when a lifetime total is
 * meaningless, e.g. a daily CPU average).
 *
 * Recording is synchronous and in-memory. Every shard accumulates into a
 * MetricBuffer; the coordinating shard periodically drains all shards and
 * writes the merged result in a single bulkWrite.
 */
class AnalyticsManager {
  constructor(db, shard, log = console) {
    this.db = db;
    this.shard = shard;
    this.log = log;
    this.collection = db.collection(COLLECTION);
    this.uniqueCollection = db.collection(UNIQUE_COLLECTION);
    this.buffer = new MetricBuffer();
    this.lastCpuSample = null;
  }

  get shardId() {
    return this.shard?.ids?.[0] ?? 0;
  }

  // ---------------------------------------------------------------- dates

  getTodayDateString() {
    return DateTime.utc().toFormat("yyyy-MM-dd");
  }

  getDateString(daysAgo = 0) {
    return DateTime.utc().minus({ days: daysAgo }).toFormat("yyyy-MM-dd");
  }

  expiryFor(dateString) {
    const parsed = DateTime.fromFormat(dateString, "yyyy-MM-dd", { zone: "utc" });
    const base = parsed.isValid ? parsed : DateTime.utc();
    return base.plus({ days: DAILY_RETENTION_DAYS }).toJSDate();
  }

  dimensions(extra = {}) {
    return { date: this.getTodayDateString(), ...extra };
  }

  // ------------------------------------------------------------- recording

  track(type, dimensions, fields) {
    this.buffer.add(type, dimensions, fields);
  }

  commandUsed({ command, category, userId, guildId, memberCount, slash }) {
    const modeField = slash ? "slashCount" : "textCount";
    const range = getSizeRange(memberCount);
    const hour = DateTime.utc().hour;
    const dims = this.dimensions();

    this.track("allCommandUsage", dims, { count: 1, [modeField]: 1 });
    this.track("commandUsage", { ...dims, command }, { count: 1, [modeField]: 1 });
    this.track("commandUsageByCategory", { ...dims, category }, { count: 1 });
    this.track("commandUsageBySize", { ...dims, range }, { count: 1 });
    this.track("hourlyUsage", { ...dims, hour }, { count: 1 });

    this.buffer.addUnique("uniqueUsers", userId);
    if (guildId) this.buffer.addUnique("activeGuilds", guildId);
  }

  commandErrored({ command, category, kind }) {
    const errorKind = ERROR_KINDS.includes(kind) ? kind : "logic";
    const dims = this.dimensions();
    const fields = { count: 1, [errorKind]: 1 };

    this.track("commandErrors", dims, fields);
    if (category) this.track("commandErrorsByCategory", { ...dims, category }, fields);
    if (command) this.track("commandErrorsByCommand", { ...dims, command }, fields);
  }

  commandCompleted({ command, ms }) {
    if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return;
    const dims = this.dimensions();
    const bucket = getLatencyBucket(ms);
    const fields = { count: 1, totalMs: ms, [bucket]: 1 };

    this.track("commandLatency", dims, fields);
    this.buffer.observeMax("commandLatency", dims, { maxMs: ms });
    this.track("commandLatencyByCommand", { ...dims, command }, fields);
    this.buffer.observeMax("commandLatencyByCommand", { ...dims, command }, { maxMs: ms });
  }

  commandBlocked({ reason, command }) {
    const dims = this.dimensions();
    this.track("commandBlocked", { ...dims, reason }, { count: 1 });
    if (command) {
      this.track("commandBlockedByCommand", { ...dims, reason, command }, { count: 1 });
    }
  }

  permissionBlocked(permissions = []) {
    const dims = this.dimensions();
    for (const permission of permissions) {
      this.track("permissionBlocked", { ...dims, permission }, { count: 1 });
    }
  }

  unknownCommandAttempted(attempted) {
    if (typeof attempted !== "string") return;
    // Unbounded user text would blow up document cardinality; only keep inputs
    // that could plausibly have been a command name.
    if (!/^[\w-]{1,20}$/.test(attempted)) return;
    this.track("unknownCommand", this.dimensions({ attempted: attempted.toLowerCase() }), {
      count: 1
    });
  }

  apiResult({ api, ok, fellBack = false }) {
    if (!api) return;
    const fields = { count: 1, [ok ? "ok" : "failed"]: 1 };
    if (fellBack) fields.fellBack = 1;
    this.track("apiCalls", this.dimensions({ api }), fields);
  }

  guildRetention(days) {
    if (typeof days !== "number" || !Number.isFinite(days) || days < 0) return;
    const dims = this.dimensions();
    const fields = { leaves: 1, totalDays: days };
    if (days < 1) fields.under24h = 1;
    if (days < 7) fields.under7d = 1;
    if (days < 30) fields.under30d = 1;

    this.track("guildRetention", dims, fields);
    this.buffer.observeMax("guildRetention", dims, { maxDays: days });
  }

  resourceSample() {
    const cpu = process.cpuUsage();
    const time = process.hrtime.bigint();
    const previous = this.lastCpuSample;
    this.lastCpuSample = { cpu, time };
    if (!previous) return;

    const elapsedMicros = Number(time - previous.time) / 1000;
    if (elapsedMicros <= 0) return;

    const usedMicros =
      cpu.user - previous.cpu.user + (cpu.system - previous.cpu.system);
    const cpuPercent = (usedMicros / elapsedMicros) * 100;
    const memRssMb = process.memoryUsage().rss / 1024 / 1024;
    const hostCpuPercent = (os.loadavg()[0] / Math.max(os.cpus().length, 1)) * 100;

    const dims = this.dimensions();
    const shardDims = this.dimensions({ shard: this.shardId });
    const fields = {
      samples: 1,
      cpuPercentTotal: cpuPercent,
      memRssMbTotal: memRssMb,
      hostCpuPercentTotal: hostCpuPercent
    };
    const peaks = { maxCpuPercent: cpuPercent, maxMemRssMb: memRssMb };

    this.track("resourceUsage", dims, fields);
    this.buffer.observeMax("resourceUsage", dims, peaks);
    this.track("resourceUsageByShard", shardDims, fields);
    this.buffer.observeMax("resourceUsageByShard", shardDims, peaks);
  }

  // ------------------------------------------------------- drain and flush

  drain() {
    return this.buffer.drain();
  }

  /**
   * Coordinator entry point: pull every shard's buffer and persist the merge.
   * Safe to call when unsharded.
   */
  async collect() {
    let payloads;
    if (this.shard) {
      payloads = await this.shard.broadcastEval((client) =>
        client.analyticsManager?.drain() ?? null
      );
    } else {
      payloads = [this.drain()];
    }

    const merged = MetricBuffer.merge(payloads);
    if (!merged.size) return 0;
    return this.persist(merged);
  }

  async persist(buffer) {
    const payload = buffer.drain();
    const operations = [];

    for (const entry of payload.entries) {
      const { date, ...dimensions } = entry.dimensions ?? {};
      const day = date ?? this.getTodayDateString();

      operations.push(
        this.buildOperation({
          id: this.buildId(entry.type, { date: day, ...dimensions }),
          inc: entry.inc,
          max: entry.max,
          expiresAt: this.expiryFor(day)
        })
      );

      const lifetimeType = METRIC_TYPES[entry.type];
      if (lifetimeType) {
        operations.push(
          this.buildOperation({
            id: this.buildId(lifetimeType, dimensions),
            inc: entry.inc,
            max: entry.max
          })
        );
      }
    }

    const uniqueOperations = this.buildUniqueOperations(payload.unique);

    await Promise.all([
      operations.length ? this.collection.bulkWrite(operations, { ordered: false }) : null,
      uniqueOperations.length
        ? this.uniqueCollection.bulkWrite(uniqueOperations, { ordered: false })
        : null
    ]);

    return operations.length + uniqueOperations.length;
  }

  /**
   * `_id` sub-documents only match exactly when their keys are in the same
   * order, so every id is built with dimensions in a fixed order.
   */
  buildId(type, dimensions = {}) {
    const id = { type };
    if (dimensions.date !== undefined) id.date = dimensions.date;
    for (const key of Object.keys(dimensions).sort()) {
      if (key === "date") continue;
      id[key] = dimensions[key];
    }
    return id;
  }

  buildOperation({ id, inc, max, expiresAt, set, setOnInsert }) {
    const update = {};
    if (inc && Object.keys(inc).length) update.$inc = inc;
    if (max && Object.keys(max).length) update.$max = max;
    if (setOnInsert && Object.keys(setOnInsert).length) update.$setOnInsert = setOnInsert;

    const setFields = { lastUpdated: new Date(), ...set };
    // Only daily documents get an expiry; lifetime totals must outlive the TTL.
    if (expiresAt) setFields.expiresAt = expiresAt;
    update.$set = setFields;

    return { updateOne: { filter: { _id: id }, update, upsert: true } };
  }

  buildUniqueOperations(unique = {}) {
    const operations = [];
    const date = this.getTodayDateString();

    for (const [setName, ids] of Object.entries(unique)) {
      const config = UNIQUE_SETS[setName];
      if (!config || !ids.length) continue;

      const daily = this.groupIntoBuckets(ids, config.buckets);
      for (const [bucket, members] of daily) {
        operations.push({
          updateOne: {
            filter: { _id: { type: setName, date, bucket } },
            update: {
              $addToSet: { ids: { $each: members } },
              $set: { lastUpdated: new Date(), expiresAt: this.expiryFor(date) }
            },
            upsert: true
          }
        });
      }

      if (!config.lifetime) continue;
      const lifetime = this.groupIntoBuckets(ids, config.lifetimeBuckets);
      for (const [bucket, members] of lifetime) {
        operations.push({
          updateOne: {
            filter: { _id: { type: config.lifetime, bucket } },
            update: {
              $addToSet: { ids: { $each: members } },
              $set: { lastUpdated: new Date() }
            },
            upsert: true
          }
        });
      }
    }

    return operations;
  }

  groupIntoBuckets(ids, buckets) {
    const grouped = new Map();
    for (const id of ids) {
      const bucket = bucketIndex(id, buckets);
      if (!grouped.has(bucket)) grouped.set(bucket, []);
      grouped.get(bucket).push(id);
    }
    return grouped;
  }

  // ------------------------------------------------- authoritative writes

  /**
   * A guild was added or removed. `totalServers`/`totalMembers` are the
   * post-change fleet totals, so the day's counts are set rather than
   * incremented and cannot drift.
   */
  async recordGuildChange({ joined, memberCount = 0, totalServers, totalMembers }) {
    const date = this.getTodayDateString();
    const range = getSizeRange(memberCount);
    const expiresAt = this.expiryFor(date);
    const direction = joined ? "increase" : "decrease";
    const sign = joined ? 1 : -1;
    const operations = [];

    const push = (type, dimensions, inc, set) =>
      operations.push(
        this.buildOperation({
          id: this.buildId(type, { date, ...dimensions }),
          inc,
          set,
          expiresAt
        })
      );

    const churn = joined ? { joins: 1 } : { leaves: 1 };

    push("totalServerCount", {}, { [direction]: 1 }, { count: totalServers });
    push("serverCount", { range }, { count: sign, [direction]: 1 });
    push("totalUserCount", {}, { [direction]: memberCount }, { count: totalMembers });
    push("memberCountBySize", { range }, {
      count: sign * memberCount,
      [direction]: memberCount
    });
    push("guildChurn", {}, churn);

    operations.push(
      this.buildOperation({ id: this.buildId("guildChurnTotal", {}), inc: churn })
    );

    await this.collection.bulkWrite(operations, { ordered: false });
    return operations.length;
  }

  /**
   * Periodic authoritative snapshot of fleet size. Keeps a day's counts correct
   * even if a join/leave event was missed, and guarantees every day has a row.
   */
  async snapshotFleet({ totalServers, totalMembers, sizeCounts = {}, memberCounts = {} }) {
    const date = this.getTodayDateString();
    const expiresAt = this.expiryFor(date);
    const operations = [];

    const snapshot = (type, dimensions, count) =>
      operations.push(
        this.buildOperation({
          id: this.buildId(type, { date, ...dimensions }),
          set: { count },
          setOnInsert: { increase: 0, decrease: 0 },
          expiresAt
        })
      );

    snapshot("totalServerCount", {}, totalServers);
    snapshot("totalUserCount", {}, totalMembers);
    for (const [range, count] of Object.entries(sizeCounts)) {
      snapshot("serverCount", { range }, count);
    }
    for (const [range, count] of Object.entries(memberCounts)) {
      snapshot("memberCountBySize", { range }, count);
    }

    if (operations.length) {
      await this.collection.bulkWrite(operations, { ordered: false });
    }
    return operations.length;
  }

  // -------------------------------------------------------------- indexes

  async ensureIndexes() {
    await Promise.all([
      this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.collection.createIndex({ "_id.type": 1, "_id.date": 1 }),
      this.collection.createIndex({ "_id.date": 1 }),
      this.uniqueCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.uniqueCollection.createIndex({ "_id.type": 1, "_id.date": 1 })
    ]);
  }

  // ---------------------------------------------------------------- reads

  async getServerCount(dateString) {
    const result = await this.collection.findOne({
      "_id.type": "totalServerCount",
      "_id.date": dateString
    });
    if (!result) return null;
    return {
      count: result.count ?? 0,
      increase: result.increase ?? 0,
      decrease: result.decrease ?? 0
    };
  }

  async countUnique(setName, dateString) {
    const type = dateString ? setName : UNIQUE_SETS[setName]?.lifetime;
    if (!type) return 0;
    const match = { "_id.type": type };
    if (dateString) match["_id.date"] = dateString;

    const [result] = await this.uniqueCollection
      .aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: { $size: { $ifNull: ["$ids", []] } } } } }
      ])
      .toArray();
    return result?.total ?? 0;
  }

  /**
   * Time series for one metric type, oldest first.
   */
  async getDailySeries(type, { days = 30, dimensions = {} } = {}) {
    const from = this.getDateString(days - 1);
    const match = { "_id.type": type, "_id.date": { $gte: from } };
    for (const [key, value] of Object.entries(dimensions)) {
      match[`_id.${key}`] = value;
    }

    const documents = await this.collection.find(match).toArray();
    return documents
      .map(({ _id, ...fields }) => ({ ...fields, ..._id }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  async getLifetimeTotals(type) {
    const documents = await this.collection
      .find({ "_id.type": type })
      .toArray();
    return documents.map(({ _id, ...fields }) => ({ ...fields, ..._id }));
  }

  /**
   * Everything the dev-facing summary needs, in two round trips.
   */
  async getSummary() {
    const today = this.getTodayDateString();
    const yesterday = this.getDateString(1);

    const [documents, uniqueUsers, activeGuilds, retentionTotal] = await Promise.all([
      this.collection.find({ "_id.date": { $in: [today, yesterday] } }).toArray(),
      this.countUnique("uniqueUsers", today),
      this.countUnique("activeGuilds", today),
      this.collection.findOne({ "_id.type": "guildRetentionTotal" })
    ]);

    const byDate = { [today]: {}, [yesterday]: {} };
    for (const { _id, ...fields } of documents) {
      const bucket = byDate[_id.date];
      if (!bucket) continue;
      if (!bucket[_id.type]) bucket[_id.type] = [];
      bucket[_id.type].push({ ...fields, ..._id });
    }

    const build = (date) => {
      const get = (type) => byDate[date]?.[type] ?? [];
      const single = (type) => get(type)[0] ?? {};
      const sum = (type, field) =>
        get(type).reduce((total, doc) => total + (doc[field] ?? 0), 0);

      const servers = single("totalServerCount");
      const members = single("totalUserCount");
      const usage = single("allCommandUsage");
      const errors = single("commandErrors");
      const latency = single("commandLatency");
      const resources = single("resourceUsage");
      const retention = single("guildRetention");

      const commandCount = usage.count ?? 0;
      const errorCount = errors.count ?? 0;
      const apiCalls = {
        count: sum("apiCalls", "count"),
        ok: sum("apiCalls", "ok"),
        failed: sum("apiCalls", "failed"),
        fellBack: sum("apiCalls", "fellBack")
      };
      const samples = resources.samples ?? 0;

      return {
        date,
        servers: {
          count: servers.count ?? 0,
          increase: servers.increase ?? 0,
          decrease: servers.decrease ?? 0,
          delta: (servers.increase ?? 0) - (servers.decrease ?? 0)
        },
        members: {
          count: members.count ?? 0,
          increase: members.increase ?? 0,
          decrease: members.decrease ?? 0,
          delta: (members.increase ?? 0) - (members.decrease ?? 0)
        },
        commands: {
          count: commandCount,
          slash: usage.slashCount ?? 0,
          text: usage.textCount ?? 0
        },
        errors: {
          count: errorCount,
          api: errors.api ?? 0,
          logic: errors.logic ?? 0,
          validation: errors.validation ?? 0,
          rate: commandCount ? errorCount / commandCount : 0
        },
        api: {
          ...apiCalls,
          failureRate: apiCalls.count ? apiCalls.failed / apiCalls.count : 0
        },
        latency: {
          count: latency.count ?? 0,
          averageMs: latency.count ? (latency.totalMs ?? 0) / latency.count : 0,
          p95Ms: this.approximatePercentile(latency, 0.95),
          maxMs: latency.maxMs ?? 0
        },
        resources: {
          samples,
          averageCpuPercent: samples ? (resources.cpuPercentTotal ?? 0) / samples : 0,
          peakCpuPercent: resources.maxCpuPercent ?? 0,
          averageMemRssMb: samples ? (resources.memRssMbTotal ?? 0) / samples : 0,
          peakMemRssMb: resources.maxMemRssMb ?? 0,
          averageHostCpuPercent: samples
            ? (resources.hostCpuPercentTotal ?? 0) / samples
            : 0
        },
        topCommands: get("commandUsage")
          .map((doc) => ({ command: doc.command, count: doc.count ?? 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        topErrors: get("commandErrorsByCommand")
          .map((doc) => ({ command: doc.command, count: doc.count ?? 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        worstApis: get("apiCalls")
          .map((doc) => ({
            api: doc.api,
            failed: doc.failed ?? 0,
            count: doc.count ?? 0
          }))
          .filter((entry) => entry.failed > 0)
          .sort((a, b) => b.failed - a.failed)
          .slice(0, 3),
        retention: {
          leaves: retention.leaves ?? 0,
          averageDays: retention.leaves
            ? (retention.totalDays ?? 0) / retention.leaves
            : 0,
          under24h: retention.under24h ?? 0
        }
      };
    };

    return {
      today: { ...build(today), uniqueUsers, activeGuilds },
      yesterday: build(yesterday),
      lifetime: {
        retention: {
          leaves: retentionTotal?.leaves ?? 0,
          averageDays: retentionTotal?.leaves
            ? (retentionTotal.totalDays ?? 0) / retentionTotal.leaves
            : 0,
          maxDays: retentionTotal?.maxDays ?? 0,
          under24h: retentionTotal?.under24h ?? 0
        }
      }
    };
  }

  /**
   * Percentile estimated from latency bucket counters. Returns the upper edge of
   * the bucket the percentile falls into.
   */
  approximatePercentile(latency = {}, percentile = 0.95) {
    const total = latency.count ?? 0;
    if (!total) return 0;

    const target = total * percentile;
    let cumulative = 0;
    for (const bucket of LATENCY_BUCKETS) {
      cumulative += latency[`le${bucket}`] ?? 0;
      if (cumulative >= target) return bucket;
    }
    return latency.maxMs ?? 0;
  }

  /**
   * Retention in days for a guild the bot just left.
   */
  static daysSince(timestamp) {
    if (!timestamp) return null;
    const days = (Date.now() - timestamp) / MS_PER_DAY;
    return days >= 0 ? days : null;
  }
}

module.exports = AnalyticsManager;
