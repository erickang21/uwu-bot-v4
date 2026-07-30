// Shared analytics vocabulary. Anything that both the recording side
// (AnalyticsManager) and the reading side (metrics command, stats API) needs to
// agree on lives here.

const DAILY_RETENTION_DAYS = 180;

const SIZE_RANGES = [
  { max: 9, label: "0-9" },
  { max: 24, label: "10-24" },
  { max: 49, label: "25-49" },
  { max: 99, label: "50-99" },
  { max: 249, label: "100-249" },
  { max: 499, label: "250-499" },
  { max: 999, label: "500-999" },
  { max: 1999, label: "1000-1999" },
  { max: 4999, label: "2000-4999" },
  { max: 9999, label: "5000-9999" }
];

const SIZE_OVERFLOW_LABEL = "10000+";
const DM_LABEL = "dm";

const SIZE_RANGE_LABELS = [
  ...SIZE_RANGES.map((range) => range.label),
  SIZE_OVERFLOW_LABEL
];

const LATENCY_BUCKETS = [100, 250, 500, 1000, 3000, 10000];

// An error is attributed to exactly one of these. "api" means an upstream
// provider failed us, "validation" means the user was told they did something
// wrong, "logic" means we have a bug.
const ERROR_KINDS = ["api", "logic", "validation"];

const BLOCK_REASONS = [
  "cooldown",
  "botPermissions",
  "userPermissions",
  "nsfw",
  "devOnly",
  "guildOnly",
  "serverConfig"
];

// Buffered counter types: daily metric type -> lifetime metric type. A null
// lifetime means the metric only makes sense per day (a daily average of CPU has
// no lifetime analogue). Fleet snapshots (totalServerCount, serverCount,
// totalUserCount, memberCountBySize, guildChurn) are written directly instead of
// being buffered, because they carry authoritative totals rather than deltas.
const METRIC_TYPES = {
  allCommandUsage: "allCommandUsageTotal",
  commandUsage: "commandUsageTotal",
  commandUsageByCategory: "commandUsageByCategoryTotal",
  commandUsageBySize: "commandUsageBySizeTotal",
  hourlyUsage: null,
  commandErrors: "commandErrorsTotal",
  commandErrorsByCategory: "commandErrorsByCategoryTotal",
  commandErrorsByCommand: "commandErrorsByCommandTotal",
  apiCalls: "apiCallsTotal",
  commandLatency: "commandLatencyTotal",
  commandLatencyByCommand: "commandLatencyByCommandTotal",
  commandBlocked: "commandBlockedTotal",
  commandBlockedByCommand: "commandBlockedByCommandTotal",
  permissionBlocked: "permissionBlockedTotal",
  unknownCommand: "unknownCommandTotal",
  guildRetention: "guildRetentionTotal",
  resourceUsage: null,
  resourceUsageByShard: null
};

// Unique-actor sets are stored sharded across several documents so no single
// document approaches the 16MB BSON ceiling as the bot grows.
const UNIQUE_SETS = {
  uniqueUsers: { buckets: 64, lifetime: "uniqueUsersTotal", lifetimeBuckets: 256 },
  activeGuilds: { buckets: 16, lifetime: "activeGuildsTotal", lifetimeBuckets: 64 }
};

function getSizeRange(memberCount) {
  if (typeof memberCount !== "number" || !Number.isFinite(memberCount)) {
    return DM_LABEL;
  }
  const match = SIZE_RANGES.find((range) => memberCount <= range.max);
  return match ? match.label : SIZE_OVERFLOW_LABEL;
}

function getLatencyBucket(ms) {
  const match = LATENCY_BUCKETS.find((bucket) => ms <= bucket);
  return match ? `le${match}` : "over";
}

function bucketIndex(value, buckets) {
  let hash = 0;
  const str = String(value);
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % buckets;
}

module.exports = {
  DAILY_RETENTION_DAYS,
  SIZE_RANGES,
  SIZE_RANGE_LABELS,
  SIZE_OVERFLOW_LABEL,
  DM_LABEL,
  LATENCY_BUCKETS,
  ERROR_KINDS,
  BLOCK_REASONS,
  METRIC_TYPES,
  UNIQUE_SETS,
  getSizeRange,
  getLatencyBucket,
  bucketIndex
};
