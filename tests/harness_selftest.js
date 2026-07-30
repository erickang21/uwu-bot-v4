#!/usr/bin/env node
"use strict";

/**
 * Self test for tests/discord_harness.js.
 *
 * Verifies the harness's own logic - response inspection, outcome
 * classification, case selection and coverage - against hand built stand-ins
 * for Discord messages, plus the development-only author gate the harness
 * depends on. Needs no token, no database and no network, so it can run
 * anywhere:
 *
 *   npm run test:harness
 *   ./tests/harness_selftest.js
 *
 * This does not test the bot's commands; it tests the thing that tests them, so
 * a broken harness cannot quietly report green.
 */

const assert = require("node:assert");
const test = require("node:test");

const CommandContext = require("../src/structures/CommandContext.js");
const CommandHandler = require("../src/structures/CommandHandler.js");
const {
  CASES,
  OUTCOME,
  checkCoverage,
  classify,
  inspectMessage,
  observedProperties,
  parseArgs,
  renderDetails,
  renderSummary,
  renderTable,
  selectCases
} = require("./discord_harness.js");

const PROBE = { id: "probe-1", createdTimestamp: 1_000 };

/**
 * Builds a stand-in for a discord.js Message with just the fields the harness
 * reads.
 */
function fakeMessage({
  id = "response-1",
  content = "",
  embeds = [],
  attachments = [],
  replyTo = PROBE.id,
  edited = false,
  createdTimestamp = 1_500,
  authorId = "bot"
} = {}) {
  return {
    id,
    content,
    embeds,
    attachments: new Map(attachments.map((attachment, index) => [String(index), attachment])),
    reference: replyTo ? { messageId: replyTo } : null,
    editedTimestamp: edited ? createdTimestamp + 100 : null,
    createdTimestamp,
    components: [],
    author: { id: authorId }
  };
}

const caseOf = (command) => CASES.find((entry) => entry.command === command);

test("inspectMessage records text replies", () => {
  const info = inspectMessage(fakeMessage({ content: "Pong! That took 12 ms.", edited: true }), PROBE);

  assert.equal(info.hasContent, true);
  assert.equal(info.embedCount, 0);
  assert.equal(info.hasImage, false);
  assert.equal(info.edited, true);
  assert.equal(info.isReplyToProbe, true);
  assert.equal(info.latencyMs, 500);
});

test("inspectMessage detects images in embeds", () => {
  const info = inspectMessage(
    fakeMessage({ embeds: [{ title: "Hug!", image: { url: "https://nekos.best/a.gif" } }] }),
    PROBE
  );

  assert.equal(info.embedCount, 1);
  assert.equal(info.hasImage, true);
  assert.equal(info.embeds[0].imageUrl, "https://nekos.best/a.gif");
  assert.equal(info.hasContent, false);
});

test("inspectMessage detects images in embed thumbnails", () => {
  const info = inspectMessage(
    fakeMessage({ embeds: [{ title: "Your Profile", thumbnail: { url: "https://cdn/x.gif" } }] }),
    PROBE
  );

  assert.equal(info.hasImage, true);
});

test("inspectMessage detects image attachments", () => {
  const info = inspectMessage(
    fakeMessage({
      embeds: [{ title: "Achievement!", image: { url: "attachment://image.png" } }],
      attachments: [{ name: "image.png", contentType: "image/png", size: 1024 }]
    }),
    PROBE
  );

  assert.equal(info.attachmentCount, 1);
  assert.equal(info.attachments[0].isImage, true);
  assert.equal(info.hasImage, true);
});

test("inspectMessage falls back to the file extension when contentType is absent", () => {
  const info = inspectMessage(
    fakeMessage({ attachments: [{ name: "image.gif", contentType: null, size: 5 }] }),
    PROBE
  );

  assert.equal(info.attachments[0].isImage, true);
});

test("a non image attachment is not counted as an image", () => {
  const info = inspectMessage(
    fakeMessage({ attachments: [{ name: "log.txt", contentType: "text/plain", size: 5 }] }),
    PROBE
  );

  assert.equal(info.attachmentCount, 1);
  assert.equal(info.hasImage, false);
});

test("observedProperties aggregates across several responses", () => {
  const observed = observedProperties([
    inspectMessage(fakeMessage({ id: "a", content: "thinking..." }), PROBE),
    inspectMessage(
      fakeMessage({ id: "b", embeds: [{ image: { url: "https://x/y.png" } }], replyTo: null }),
      PROBE
    )
  ]);

  assert.deepEqual(observed, {
    message: true,
    content: true,
    embed: true,
    image: true,
    attachment: false,
    edited: false,
    reply: true
  });
});

test("no response is a timeout", () => {
  const { outcome, reason } = classify(caseOf("hug"), []);

  assert.equal(outcome, OUTCOME.TIMEOUT);
  assert.match(reason, /no response/i);
});

test("a satisfied expectation passes", () => {
  const responses = [
    inspectMessage(fakeMessage({ embeds: [{ title: "Hug!", image: { url: "https://x/y.gif" } }] }), PROBE)
  ];

  assert.equal(classify(caseOf("hug"), responses).outcome, OUTCOME.PASS);
});

test("a missing expectation fails and names the property", () => {
  const responses = [inspectMessage(fakeMessage({ embeds: [{ title: "Hug!" }] }), PROBE)];
  const { outcome, missing, reason } = classify(caseOf("hug"), responses);

  assert.equal(outcome, OUTCOME.FAIL);
  assert.deepEqual(missing, ["image"]);
  assert.match(reason, /image/);
});

test("ping must be edited, not just sent", () => {
  const notEdited = [inspectMessage(fakeMessage({ content: "Ping? <a:loading>" }), PROBE)];
  const edited = [inspectMessage(fakeMessage({ content: "Pong! That took 40 ms.", edited: true }), PROBE)];

  assert.equal(classify(caseOf("ping"), notEdited).outcome, OUTCOME.FAIL);
  assert.equal(classify(caseOf("ping"), edited).outcome, OUTCOME.PASS);
});

test("a did-you-mean suggestion means the command is gone", () => {
  const responses = [inspectMessage(fakeMessage({ content: "|`❔`| Did you mean `hug`?" }), PROBE)];
  const { outcome, reason } = classify(caseOf("hug"), responses);

  assert.equal(outcome, OUTCOME.FAIL);
  assert.match(reason, /not found/i);
});

test("a thrown command is a failure, not a degraded dependency", () => {
  const responses = [
    inspectMessage(
      fakeMessage({
        embeds: [
          {
            title: "An error occurred.",
            description: "Something went wrong while running ``beautiful``. Don't worry, it's not your fault!"
          }
        ]
      }),
      PROBE
    )
  ];

  const { outcome, reason } = classify(caseOf("beautiful"), responses);
  assert.equal(outcome, OUTCOME.FAIL);
  assert.match(reason, /threw/i);
});

test("the dev-facing error embed is also a failure", () => {
  const responses = [
    inspectMessage(
      fakeMessage({ embeds: [{ description: "❌ **``hug`` threw an error**\n```js\nTypeError```" }] }),
      PROBE
    )
  ];

  assert.equal(classify(caseOf("hug"), responses).outcome, OUTCOME.FAIL);
});

test("a handled dependency failure is degraded", () => {
  const responses = [
    inspectMessage(
      fakeMessage({ content: "An error occurred with the image generation API. :x:" }),
      PROBE
    )
  ];

  const { outcome, reason } = classify(caseOf("beautiful"), responses);
  assert.equal(outcome, OUTCOME.DEGRADED);
  assert.match(reason, /dependency/i);
});

test("an empty leaderboard is degraded, not failed", () => {
  const responses = [
    inspectMessage(
      fakeMessage({ content: "I'm unable to create a leaderboard! This is probably because..." }),
      PROBE
    )
  ];

  assert.equal(classify(caseOf("leaderboard"), responses).outcome, OUTCOME.DEGRADED);
});

test("the shared upstream-API failure reply is degraded for any command", () => {
  const responses = [
    inspectMessage(
      fakeMessage({
        content:
          "An error occurred with the service processing your request. Please try again later."
      }),
      PROBE
    )
  ];

  // owoify declares no pattern for this; it is recognised globally.
  assert.equal(classify(caseOf("owoify"), responses).outcome, OUTCOME.DEGRADED);
  assert.equal(classify(caseOf("hug"), responses).outcome, OUTCOME.DEGRADED);
});

test("a cooldown reply is degraded", () => {
  const responses = [
    inspectMessage(fakeMessage({ content: "You baka! This command is still on cooldown." }), PROBE)
  ];

  assert.equal(classify(caseOf("balance"), responses).outcome, OUTCOME.DEGRADED);
});

test("a permission refusal is blocked, not failed", () => {
  const responses = [
    inspectMessage(
      fakeMessage({ content: "You need the following permission(s) to run that command: **ModerateMembers**" }),
      PROBE
    )
  ];

  const { outcome, reason } = classify(caseOf("audit"), responses);
  assert.equal(outcome, OUTCOME.BLOCKED);
  assert.match(reason, /refused/i);
});

test("cases that expect a refusal pass on a validation message", () => {
  const responses = [
    inspectMessage(fakeMessage({ content: "Please enter a valid user mention or an ID!" }), PROBE)
  ];

  assert.equal(classify(caseOf("mute"), responses).outcome, OUTCOME.PASS);
});

test("cases that expect a refusal also pass on a permission refusal", () => {
  const responses = [
    inspectMessage(
      fakeMessage({ content: "I need the following permission(s) to run that command: **ModerateMembers**" }),
      PROBE
    )
  ];

  assert.equal(classify(caseOf("mute"), responses).outcome, OUTCOME.PASS);
});

test("cases that expect a refusal fail when the bot says nothing readable", () => {
  const responses = [inspectMessage(fakeMessage({ content: "" }), PROBE)];

  const { outcome, reason } = classify(caseOf("mute"), responses);
  assert.equal(outcome, OUTCOME.FAIL);
  assert.match(reason, /refusal/i);
});

test("every category except the excluded and dev-only ones has two cases", () => {
  const { gaps, exempt, covered } = checkCoverage();

  assert.deepEqual(gaps, [], `coverage gaps: ${gaps.join("; ")}`);
  assert.equal(covered, CASES.length);
  assert.ok(
    exempt.some((entry) => entry.startsWith("analytics")),
    "analytics should be exempt: both of its commands are devOnly"
  );
});

test("no case targets a developer or nsfw command", () => {
  for (const testCase of CASES) {
    assert.ok(
      !["developer", "nsfw"].includes(testCase.category),
      `${testCase.command} is in an excluded category`
    );
  }
});

test("every case declares at least one expectation", () => {
  for (const testCase of CASES) {
    const expectations = Object.keys(testCase.expect ?? {});
    assert.ok(expectations.length > 0, `${testCase.command} declares no expectations`);
    assert.equal(testCase.expect.message, true, `${testCase.command} must expect a message`);
  }
});

test("filters select by command, alias target and category", () => {
  assert.deepEqual(
    selectCases({ only: ["ping"], categories: null }).map((entry) => entry.command),
    ["ping"]
  );
  // 8ball is an alias of eightball; both names resolve to the same case.
  assert.deepEqual(
    selectCases({ only: ["eightball"], categories: null }).map((entry) => entry.command),
    ["8ball"]
  );
  assert.deepEqual(
    selectCases({ only: null, categories: ["mod"] }).map((entry) => entry.command),
    ["audit", "mute"]
  );
});

// --- reporting ---------------------------------------------------------------

/** Runs a renderer with console.log captured, and returns what it printed. */
function capture(render) {
  const original = console.log;
  const lines = [];
  console.log = (...args) => lines.push(args.join(" "));
  try {
    const value = render();
    return { lines, output: lines.join("\n"), value };
  } finally {
    console.log = original;
  }
}

const fakeResult = (overrides) => ({
  category: "anime",
  command: "hug",
  invocation: "uwu hug",
  note: null,
  expected: { message: true, embed: true, image: true },
  observed: observedProperties([
    inspectMessage(fakeMessage({ embeds: [{ image: { url: "https://x/y.gif" } }] }), PROBE)
  ]),
  missing: [],
  outcome: OUTCOME.PASS,
  reason: null,
  responseCount: 1,
  latencyMs: 412,
  elapsedMs: 2900,
  responses: [],
  ...overrides
});

test("the table marks observed, missing and unexpected properties", () => {
  const results = [
    fakeResult({}),
    fakeResult({
      command: "beautiful",
      category: "images",
      outcome: OUTCOME.FAIL,
      missing: ["image"],
      reason: "missing expected property: image",
      observed: observedProperties([inspectMessage(fakeMessage({ embeds: [{ title: "x" }] }), PROBE)])
    })
  ];

  const { output } = capture(() => renderTable(results));
  const rows = output.split("\n").filter((line) => /^(anime|images)\s/.test(line));

  assert.equal(rows.length, 2);
  // hug: message, embed and image all observed and expected.
  assert.match(rows[0], /^anime\s+hug\s+PASS\s+412\s+y\s+-\s+y\s+y\s+-\s+-\s+y$/);
  // beautiful: the expected image is missing, so it is flagged with N. The
  // attachment column stays "-" because this row does not expect one.
  assert.match(rows[1], /^images\s+beautiful\s+FAIL\s+412\s+y\s+-\s+y\s+N\s+-\s+-\s+y$/);
  assert.match(output, /CATEGORY\s+COMMAND\s+OUTCOME\s+MS/);
});

test("a missing latency renders as a dash rather than null", () => {
  const { output } = capture(() =>
    renderTable([fakeResult({ outcome: OUTCOME.TIMEOUT, latencyMs: null, observed: observedProperties([]) })])
  );

  assert.doesNotMatch(output, /null/);
  assert.match(output, /TIMEOUT\s+-/);
});

test("details list every non-passing case with its reason", () => {
  const { output } = capture(() =>
    renderDetails([
      fakeResult({}),
      fakeResult({ command: "mute", outcome: OUTCOME.BLOCKED, reason: "invocation was refused: ...", note: "n/a" })
    ])
  );

  assert.match(output, /BLOCKED\s+anime\/mute/);
  assert.match(output, /invocation was refused/);
  assert.match(output, /note: n\/a/);
  assert.doesNotMatch(output, /PASS/);
});

test("the summary counts outcomes and only fails on hard failures", () => {
  const results = [
    fakeResult({}),
    fakeResult({ outcome: OUTCOME.DEGRADED }),
    fakeResult({ outcome: OUTCOME.BLOCKED })
  ];

  const lenient = capture(() => renderSummary(results, { strict: false }));
  assert.equal(lenient.value, 0);
  assert.match(lenient.output, /3 case\(s\)/);
  assert.match(lenient.output, /1 pass/);
  assert.match(lenient.output, /1 degraded/);
  assert.match(lenient.output, /1 blocked/);

  // --strict promotes degraded and blocked to failures.
  assert.equal(capture(() => renderSummary(results, { strict: true })).value, 2);

  const failed = [fakeResult({ outcome: OUTCOME.FAIL }), fakeResult({ outcome: OUTCOME.TIMEOUT })];
  assert.equal(capture(() => renderSummary(failed, { strict: false })).value, 2);
});

// --- the gate the harness depends on ----------------------------------------
// The harness posts commands as a bot, so handleMessage() has to accept bot
// authors in development and keep ignoring them everywhere else.

const authorGate = (dev, bot) =>
  new CommandHandler({ dev }).isAuthorAllowed({ author: { bot } });

test("humans can always run commands", () => {
  assert.equal(authorGate(false, false), true);
  assert.equal(authorGate(true, false), true);
});

test("bots can run commands in development only", () => {
  assert.equal(authorGate(true, true), true);
  assert.equal(authorGate(false, true), false);
});

// --- keeping harness traffic out of the metrics -----------------------------
// Accepting bot authors in development means the harness's own runs reach every
// analytics call site. They must all sit behind ctx.trackable, or a harness run
// shows up as real usage.

const contextFor = (bot) =>
  new CommandContext(null, { message: { author: { bot, id: "1" } } });

test("a bot-authored context is not trackable", () => {
  assert.equal(contextFor(false).trackable, true);
  assert.equal(contextFor(true).trackable, false);
  // Interactions cannot be bot-authored, so slash is always recorded.
  assert.equal(new CommandContext(null, { interaction: {} }).trackable, true);
});

test("harness traffic runs the command but records nothing", async () => {
  const recorded = [];
  const analytics = new Proxy(
    {},
    { get: (_, name) => (...args) => recorded.push({ name, args }) }
  );
  const handler = new CommandHandler({ analyticsManager: analytics });
  const command = { name: "hug", category: "Anime", execute: () => "ran" };

  const harness = contextFor(true);
  assert.equal(await handler.executeTracked(harness, command, false), "ran");
  handler.recordBlock(harness, command, "cooldown");
  assert.deepEqual(recorded, [], "harness traffic must not reach analytics");

  const human = contextFor(false);
  assert.equal(await handler.executeTracked(human, command, false), "ran");
  handler.recordBlock(human, command, "cooldown");
  assert.deepEqual(
    recorded.map((entry) => entry.name),
    ["commandUsed", "commandCompleted", "commandBlocked"]
  );
});

test("broadcast falls back to a local call when unsharded", async () => {
  const client = { shard: null, totalCommandUses: 7 };
  const handler = new CommandHandler(client);

  assert.deepEqual(await handler.broadcast((c) => c.totalCommandUses), [7]);
  assert.deepEqual(
    await handler.broadcast((c, context) => [c.totalCommandUses, context.extra], { context: { extra: "x" } }),
    [[7, "x"]]
  );
});

test("broadcast uses broadcastEval when sharded", async () => {
  const calls = [];
  const client = {
    shard: {
      broadcastEval: (fn, options) => {
        calls.push(options);
        return Promise.resolve([1, 2]);
      }
    }
  };

  assert.deepEqual(await new CommandHandler(client).broadcast(() => 0, { context: { a: 1 } }), [1, 2]);
  assert.deepEqual(calls, [{ context: { a: 1 } }]);
});

test("parseArgs reads flags, values and rejects nonsense", () => {
  const config = parseArgs(["--attach", "--only=hug,ping", "--timeout=500", "--prefix=uwu ", "--strict"]);

  assert.equal(config.attach, true);
  assert.deepEqual(config.only, ["hug", "ping"]);
  assert.equal(config.timeout, 500);
  assert.equal(config.prefix, "uwu ");
  assert.equal(config.strict, true);

  assert.throws(() => parseArgs(["--nope"]), /Unknown option/);
  assert.throws(() => parseArgs(["--timeout=abc"]), /non-negative/);
});
