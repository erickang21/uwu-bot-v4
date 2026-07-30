const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis.js");

const SECTIONS = [
  "commands",
  "errors",
  "api",
  "latency",
  "servers",
  "size",
  "churn",
  "resources",
  "hours"
];

class Metrics extends Command {
  constructor(...args) {
    super(...args, {
      description: "shows an at-a-glance operational summary of the bot.",
      usage: "metrics [section]",
      aliases: ["health", "analytics"],
      devOnly: true,
      modes: ["text"],
      options: [
        {
          name: "section",
          type: "string",
          description: `drill into one area: ${SECTIONS.join(", ")}`
        }
      ]
    });
  }

  async run(ctx, options) {
    const section = options.getString("section")?.toLowerCase();

    if (section && !SECTIONS.includes(section)) {
      return `Unknown section. Pick one of: ${SECTIONS.join(", ")}.`;
    }

    const embed = section
      ? await this.renderSection(ctx, section)
      : await this.renderOverview(ctx);

    return ctx.reply({ embeds: [embed] });
  }

  // ------------------------------------------------------------- overview

  async renderOverview(ctx) {
    const analytics = this.client.analyticsManager;
    const { today, yesterday, lifetime } = await analytics.getSummary();

    const defect = Metrics.defectRate(today);
    const slashShare = today.commands.count
      ? today.commands.slash / today.commands.count
      : 0;

    const headline = [
      `${Metrics.healthDot(today)} **${today.date}** (UTC) · refreshed every minute`,
      "",
      `${emojis.blueRightArrow} **Servers** ${Metrics.num(today.servers.count)} · ` +
        `${emojis.up}${Metrics.num(today.servers.increase)} ${emojis.down}${Metrics.num(today.servers.decrease)} ` +
        `→ net **${Metrics.delta(today.servers.delta)}**`,
      `${emojis.blueRightArrow} **Commands** ${Metrics.num(today.commands.count)} · ` +
        `${Metrics.pct(slashShare, 0)} slash · ${Metrics.change(today.commands.count, yesterday.commands.count)} vs yesterday`,
      `${emojis.blueRightArrow} **Failure rate** ${Metrics.pct(defect)} · ` +
        `${Metrics.num(today.errors.api)} api · ${Metrics.num(today.errors.logic)} logic`,
      `${emojis.blueRightArrow} **Latency** ${Metrics.ms(today.latency.averageMs)} avg · ` +
        `${Metrics.ms(today.latency.p95Ms)} p95`
    ].join("\n");

    const embed = this.client
      .embed(ctx.author)
      .setTitle(`uwu bot metrics ${emojis.star}`)
      .setDescription(headline)
      .addFields(
        {
          name: "Reach",
          value:
            `${Metrics.num(today.activeGuilds)} servers active\n` +
            `${Metrics.num(today.uniqueUsers)} users`,
          inline: true
        },
        {
          name: "Members",
          value:
            `${Metrics.num(today.members.count)}\n` +
            `net ${Metrics.delta(today.members.delta)}`,
          inline: true
        },
        {
          name: "API health",
          value: today.api.count
            ? `${Metrics.pct(today.api.failureRate)} failed\n${Metrics.worstApiLine(today)}`
            : "no calls yet",
          inline: true
        },
        {
          name: "Resources",
          value: today.resources.samples
            ? `${today.resources.averageCpuPercent.toFixed(0)}% cpu (peak ${today.resources.peakCpuPercent.toFixed(0)}%)\n` +
              `${today.resources.averageMemRssMb.toFixed(0)} MB rss`
            : "no samples yet",
          inline: true
        },
        {
          name: "Churn",
          value:
            `${Metrics.num(today.retention.leaves)} left today\n` +
            `${lifetime.retention.averageDays.toFixed(0)}d avg stay · ${Metrics.num(today.retention.under24h)} <24h`,
          inline: true
        },
        {
          name: "Top today",
          value: Metrics.listOrDash(
            today.topCommands.slice(0, 3).map(
              (entry) => `${entry.command} ${Metrics.num(entry.count)}`
            )
          ),
          inline: true
        }
      )
      .setFooter({
        text: `${Metrics.num(today.errors.validation)} user-input errors today (not counted as failures) · uwu metrics <${SECTIONS.join("|")}>`
      });

    return embed;
  }

  // ------------------------------------------------------------- sections

  async renderSection(ctx, section) {
    const analytics = this.client.analyticsManager;
    const renderers = {
      commands: () => this.sectionCommands(analytics),
      errors: () => this.sectionErrors(analytics),
      api: () => this.sectionApi(analytics),
      latency: () => this.sectionLatency(analytics),
      servers: () => this.sectionServers(analytics),
      size: () => this.sectionSize(analytics),
      churn: () => this.sectionChurn(analytics),
      resources: () => this.sectionResources(analytics),
      hours: () => this.sectionHours(analytics)
    };

    const { title, body } = await renderers[section]();
    return this.client
      .embed(ctx.author)
      .setTitle(`Metrics · ${title}`)
      .setDescription(body)
      .setFooter({ text: `${analytics.getTodayDateString()} (UTC)` });
  }

  async sectionCommands(analytics) {
    const [today, allTime] = await Promise.all([
      analytics.getDailySeries("commandUsage", { days: 1 }),
      analytics.getLifetimeTotals("commandUsageTotal")
    ]);

    const rank = (rows) =>
      rows
        .map((row) => ({ command: row.command, count: row.count ?? 0 }))
        .sort((a, b) => b.count - a.count);

    return {
      title: "command usage",
      body: [
        "**Today**",
        Metrics.listOrDash(
          rank(today)
            .slice(0, 12)
            .map((row) => `\`${row.command}\` ${Metrics.num(row.count)}`)
        ),
        "",
        "**Lifetime**",
        Metrics.listOrDash(
          rank(allTime)
            .slice(0, 12)
            .map((row) => `\`${row.command}\` ${Metrics.num(row.count)}`)
        )
      ].join("\n")
    };
  }

  async sectionErrors(analytics) {
    const [byCommand, byCategory, totals] = await Promise.all([
      analytics.getDailySeries("commandErrorsByCommand", { days: 1 }),
      analytics.getDailySeries("commandErrorsByCategory", { days: 1 }),
      analytics.getDailySeries("commandErrors", { days: 1 })
    ]);

    const overall = totals[0] ?? {};
    const describe = (row) =>
      `${Metrics.num(row.count ?? 0)} (${Metrics.num(row.api ?? 0)} api / ${Metrics.num(row.logic ?? 0)} logic / ${Metrics.num(row.validation ?? 0)} input)`;

    return {
      title: "errors",
      body: [
        `**Today** ${describe(overall)}`,
        "",
        "**By command**",
        Metrics.listOrDash(
          byCommand
            .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
            .slice(0, 10)
            .map((row) => `\`${row.command}\` ${describe(row)}`)
        ),
        "",
        "**By category**",
        Metrics.listOrDash(
          byCategory
            .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
            .map((row) => `${row.category} ${describe(row)}`)
        )
      ].join("\n")
    };
  }

  async sectionApi(analytics) {
    const rows = await analytics.getDailySeries("apiCalls", { days: 1 });

    return {
      title: "upstream APIs",
      body: Metrics.listOrDash(
        rows
          .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
          .map((row) => {
            const count = row.count ?? 0;
            const failed = row.failed ?? 0;
            const rate = count ? failed / count : 0;
            return (
              `${Metrics.dotFor(rate, 0.03, 0.1)} \`${row.api}\` ` +
              `${Metrics.num(count)} calls · ${Metrics.pct(rate)} failed · ` +
              `${Metrics.num(row.fellBack ?? 0)} fell back to local`
            );
          })
      )
    };
  }

  async sectionLatency(analytics) {
    const rows = await analytics.getDailySeries("commandLatencyByCommand", { days: 1 });

    const enriched = rows
      .map((row) => ({
        command: row.command,
        count: row.count ?? 0,
        averageMs: row.count ? (row.totalMs ?? 0) / row.count : 0,
        p95Ms: analytics.approximatePercentile(row, 0.95),
        maxMs: row.maxMs ?? 0
      }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.averageMs - a.averageMs);

    return {
      title: "latency (slowest first)",
      body: Metrics.listOrDash(
        enriched
          .slice(0, 12)
          .map(
            (row) =>
              `\`${row.command}\` ${Metrics.ms(row.averageMs)} avg · ` +
              `${Metrics.ms(row.p95Ms)} p95 · ${Metrics.ms(row.maxMs)} max · ` +
              `${Metrics.num(row.count)} runs`
          )
      )
    };
  }

  async sectionServers(analytics) {
    const rows = await analytics.getDailySeries("totalServerCount", { days: 14 });

    return {
      title: "server trend (14d)",
      body: Metrics.listOrDash(
        rows
          .slice()
          .reverse()
          .map(
            (row) =>
              `\`${row.date}\` ${Metrics.num(row.count ?? 0)} · ` +
              `${emojis.up}${row.increase ?? 0} ${emojis.down}${row.decrease ?? 0} ` +
              `(${Metrics.delta((row.increase ?? 0) - (row.decrease ?? 0))})`
          )
      )
    };
  }

  async sectionSize(analytics) {
    const [servers, usage] = await Promise.all([
      analytics.getDailySeries("serverCount", { days: 1 }),
      analytics.getDailySeries("commandUsageBySize", { days: 1 })
    ]);

    const usageTotal = usage.reduce((total, row) => total + (row.count ?? 0), 0);
    const byRange = new Map(usage.map((row) => [row.range, row.count ?? 0]));

    return {
      title: "by server size",
      body: [
        "**Servers · share of usage today**",
        Metrics.listOrDash(
          servers
            .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
            .map((row) => {
              const used = byRange.get(row.range) ?? 0;
              const share = usageTotal ? used / usageTotal : 0;
              return `\`${row.range}\` ${Metrics.num(row.count ?? 0)} servers · ${Metrics.pct(share, 1)} of usage`;
            })
        )
      ].join("\n")
    };
  }

  async sectionChurn(analytics) {
    const [today, churnToday, lifetimeRetention, lifetimeChurn] = await Promise.all([
      analytics.getDailySeries("guildRetention", { days: 1 }),
      analytics.getDailySeries("guildChurn", { days: 1 }),
      analytics.getLifetimeTotals("guildRetentionTotal"),
      analytics.getLifetimeTotals("guildChurnTotal")
    ]);

    const describe = (row = {}) => {
      const leaves = row.leaves ?? 0;
      const average = leaves ? (row.totalDays ?? 0) / leaves : 0;
      return (
        `${Metrics.num(leaves)} left · ${average.toFixed(1)}d avg stay · ` +
        `${Metrics.num(row.under24h ?? 0)} <24h · ${Metrics.num(row.under7d ?? 0)} <7d · ` +
        `${Metrics.num(row.under30d ?? 0)} <30d`
      );
    };

    const joinsToday = churnToday[0]?.joins ?? 0;
    const allTime = lifetimeChurn[0] ?? {};

    return {
      title: "retention and churn",
      body: [
        `**Today** ${Metrics.num(joinsToday)} joined · ${describe(today[0])}`,
        "",
        `**Lifetime** ${Metrics.num(allTime.joins ?? 0)} joins / ${Metrics.num(allTime.leaves ?? 0)} leaves`,
        describe(lifetimeRetention[0]),
        `longest stay ${(lifetimeRetention[0]?.maxDays ?? 0).toFixed(0)}d`
      ].join("\n")
    };
  }

  async sectionResources(analytics) {
    const rows = await analytics.getDailySeries("resourceUsageByShard", { days: 1 });

    return {
      title: "resources by shard",
      body: Metrics.listOrDash(
        rows
          .map((row) => ({
            shard: row.shard,
            samples: row.samples ?? 0,
            cpu: row.samples ? (row.cpuPercentTotal ?? 0) / row.samples : 0,
            peakCpu: row.maxCpuPercent ?? 0,
            mem: row.samples ? (row.memRssMbTotal ?? 0) / row.samples : 0,
            peakMem: row.maxMemRssMb ?? 0
          }))
          .sort((a, b) => b.cpu - a.cpu)
          .slice(0, 15)
          .map(
            (row) =>
              `\`shard ${row.shard}\` ${row.cpu.toFixed(0)}% cpu (peak ${row.peakCpu.toFixed(0)}%) · ` +
              `${row.mem.toFixed(0)} MB (peak ${row.peakMem.toFixed(0)} MB)`
          )
      )
    };
  }

  async sectionHours(analytics) {
    const rows = await analytics.getDailySeries("hourlyUsage", { days: 1 });
    const byHour = new Map(rows.map((row) => [Number(row.hour), row.count ?? 0]));
    const peak = Math.max(1, ...byHour.values());

    const lines = [];
    for (let hour = 0; hour < 24; hour++) {
      const count = byHour.get(hour) ?? 0;
      lines.push(
        `\`${String(hour).padStart(2, "0")}\` ${Metrics.bar(count, peak)} ${Metrics.num(count)}`
      );
    }

    return { title: "usage by hour (UTC)", body: lines.join("\n") };
  }

  // ------------------------------------------------------------ formatting

  /**
   * Rate of failures we are responsible for or affected by. User-input errors
   * are excluded: a user mistyping an argument is not the bot misbehaving, and
   * folding them in would keep the number permanently high.
   */
  static defectRate(summary) {
    if (!summary.commands.count) return 0;
    return (summary.errors.logic + summary.errors.api) / summary.commands.count;
  }

  static healthDot(summary) {
    const defect = Metrics.defectRate(summary);
    const worse = Math.max(defect, summary.api.failureRate);
    return Metrics.dotFor(worse, 0.01, 0.03);
  }

  static dotFor(value, warn, bad) {
    if (value >= bad) return emojis.dnd;
    if (value >= warn) return emojis.idle;
    return emojis.online;
  }

  static num(value = 0) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "0";
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return Math.round(value).toLocaleString("en-US");
  }

  static pct(value = 0, digits = 2) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "0%";
    return `${(value * 100).toFixed(digits)}%`;
  }

  static ms(value = 0) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "0ms";
    return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
  }

  static delta(value = 0) {
    if (!value) return "±0";
    return `${value > 0 ? "+" : "-"}${Metrics.num(Math.abs(value))}`;
  }

  static change(current = 0, previous = 0) {
    if (!previous) return current ? "new" : "flat";
    const ratio = (current - previous) / previous;
    if (Math.abs(ratio) < 0.005) return "flat";
    return `${ratio > 0 ? "+" : ""}${(ratio * 100).toFixed(1)}%`;
  }

  static worstApiLine(summary) {
    const worst = summary.worstApis[0];
    if (!worst) return "all clear";
    return `${worst.api} ${Metrics.num(worst.failed)}`;
  }

  static listOrDash(lines) {
    return lines.length ? lines.join("\n") : "—";
  }

  static bar(value, max, width = 10) {
    const filled = max > 0 ? Math.round((value / max) * width) : 0;
    return "█".repeat(filled) + "░".repeat(Math.max(0, width - filled));
  }
}

module.exports = Metrics;
