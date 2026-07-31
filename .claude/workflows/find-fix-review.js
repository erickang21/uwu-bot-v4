export const meta = {
  name: 'find-fix-review',
  description: 'Find bugs, fix each on its own branch + PR, then independently review each fix',
  whenToUse: 'A find -> fix -> review sweep of the codebase where each confirmed bug becomes its own branch, PR, and review verdict.',
  phases: [
    { title: 'Find', detail: 'read-only bug-finders fan out over subsystems' },
    { title: 'Fix', detail: 'one worktree-isolated fixer per bug: branch, fix, PR' },
    { title: 'Review', detail: 'an independent reviewer judges each fix' }
  ]
}

// ---------------------------------------------------------------------------
// Structured hand-off contracts between the three roles.
// ---------------------------------------------------------------------------

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    bugs: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'integer' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          description: { type: 'string' },
          failure_scenario: { type: 'string' }
        },
        required: ['title', 'file', 'severity', 'description', 'failure_scenario']
      }
    }
  },
  required: ['bugs']
}

const FIX_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    fixed: { type: 'boolean' },
    branch: { type: ['string', 'null'] },
    pr_number: { type: ['integer', 'null'] },
    pr_url: { type: ['string', 'null'] },
    summary: { type: 'string' },
    skipped_reason: { type: ['string', 'null'] }
  },
  required: ['fixed', 'summary']
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    verdict: { type: 'string', enum: ['looks-good', 'has-issues', 'blocking'] },
    logic_errors: { type: 'array', items: { type: 'string' } },
    other_issues: { type: 'array', items: { type: 'string' } },
    comment_posted: { type: 'boolean' },
    comment_url: { type: ['string', 'null'] },
    notes: { type: 'string' }
  },
  required: ['verdict', 'comment_posted', 'notes']
}

// ---------------------------------------------------------------------------
// Knobs (pass via Workflow `args`):
//   areas:     string[]  subsystems to audit (one finder each). Defaults below.
//   maxFixes:  number    cap on how many bugs become PRs this run (default 3).
//   openPr:    boolean   false => fixers stop after pushing the branch, no PR
//                        (safe first run). Default true.
// ---------------------------------------------------------------------------

// Each finder mines the offline logs mirror (real user-facing misbehavior)
// PLUS the codebase area it's assigned, and reports fine-grained, single-problem
// bugs. The logs are the shared front-line signal for every area.
const DEFAULT_AREAS = [
  'sharding & startup readiness: index.js, src/index.js, src/events/uwuReady.js, and every broadcastEval / client.shard access that could run before shards finish spawning (the logs show ShardingInProcess crashes — start there)',
  'API helpers & error handling in src/helpers/* (anime.js, api.js, apiMetrics.js) — null handling, JSON parse failures on non-JSON responses, ApiError vs bare-throw classification, and how those surface to the user in a command reply',
  'command dispatch, cooldowns, economy/leveling correctness, and the ctx.trackable analytics/XP guards in src/structures/CommandHandler.js and src/structures/AnalyticsManager.js'
]

// args can arrive as an object or, depending on how the workflow is invoked,
// as a JSON-encoded string — normalize both so the knobs actually apply.
let opts = args || {}
if (typeof opts === 'string') {
  try {
    opts = JSON.parse(opts)
  } catch (e) {
    opts = {}
  }
}

const areas = Array.isArray(opts.areas) && opts.areas.length ? opts.areas : DEFAULT_AREAS
const maxFixes = Number.isInteger(opts.maxFixes) ? opts.maxFixes : 3
const openPr = opts.openPr !== false

// ---------------------------------------------------------------------------
// Phase 1 — Find (read-only, parallel by subsystem, then dedup + rank)
// ---------------------------------------------------------------------------

phase('Find')

const finderResults = await parallel(
  areas.map((area, i) => () =>
    agent(
      `Pull and read the offline logs mirror (/workspace/uwu-bot-logs: error.log, out.log) for real runtime misbehavior, THEN audit this codebase area:\n${area}\n\n` +
        'Report fine-grained, user-facing bugs — each one specific problem fixable in a small self-contained change, with file:line and a concrete failure scenario. ' +
        'Prefer bugs backed by log evidence. Return an empty list if you find nothing solid here.',
      { label: `find:${i + 1}`, phase: 'Find', agentType: 'bug-finder', schema: FINDINGS_SCHEMA }
    )
  )
)

const seen = new Set()
const found = finderResults
  .filter(Boolean)
  .flatMap((r) => r.bugs || [])
  .filter((b) => {
    const key = `${b.file}:${b.line}:${b.title}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

log(`Find: ${found.length} unique candidate bug(s)`)
if (found.length === 0) return { found: 0, actioned: 0, results: [] }

const weight = { critical: 3, high: 2, medium: 1, low: 0 }
const ranked = found.slice().sort((a, b) => (weight[b.severity] ?? 1) - (weight[a.severity] ?? 1))
const selected = ranked.slice(0, maxFixes)
if (ranked.length > selected.length) {
  log(`Capping at ${maxFixes} fix(es); ${ranked.length - selected.length} lower-severity bug(s) left for a later run`)
}

// ---------------------------------------------------------------------------
// Phase 2 -> 3 — Fix then Review, pipelined per bug (review starts as soon as a
// given fix lands; it does not wait for the other fixers).
// ---------------------------------------------------------------------------

const results = await pipeline(
  selected,
  // Stage 1: fixer on an isolated worktree — feature branch, step-by-step
  // commits, harness the affected command(s), then PR.
  (bug) =>
    agent(
      `Fix exactly this one bug, then ${openPr ? 'raise a PR' : 'push the branch (do NOT open a PR this run)'}.\n\n` +
        `Title: ${bug.title}\nFile: ${bug.file}:${bug.line ?? '?'}\nSeverity: ${bug.severity}\n` +
        `Description: ${bug.description}\nFailure scenario: ${bug.failure_scenario}\n\n` +
        'Create a feature branch for this one issue, implement the minimal fix (minimal comments), commit step by step, ' +
        'and if the fix touches a command run the test harness (node tests/discord_harness.js --only=<command>) to confirm correct behavior. ' +
        (openPr
          ? 'Then follow your workflow through raising the PR.'
          : 'Then STOP before opening a PR; push the branch and set pr_number/pr_url to null.'),
      { label: `fix:${bug.title}`, phase: 'Fix', agentType: 'fixer', isolation: 'worktree', schema: FIX_SCHEMA }
    ),
  // Stage 2: reviewer reads the diff, then posts a comment on the PR.
  (fix, bug) => {
    if (!fix || !fix.fixed) return { bug, fix, review: null }
    const target = fix.pr_number
      ? `Review PR #${fix.pr_number} (${fix.pr_url ?? ''}) and POST your findings as a comment on that PR.`
      : `No PR was opened; review the diff on branch ${fix.branch ?? 'n/a'} (git fetch origin ${fix.branch}; git diff origin/main...origin/${fix.branch}) and return your findings WITHOUT posting a comment (set comment_posted=false).`
    return agent(
      `${target}\n\n` +
        `Focus on the diff. Original bug: ${bug.title} (${bug.file}:${bug.line ?? '?'})\n${bug.description}\n` +
        `Failure scenario: ${bug.failure_scenario}\nFixer's summary: ${fix.summary}\n\n` +
        'Identify logic errors tied to the diff and any other issues (regressions, scope, conventions).',
      { label: `review:${bug.title}`, phase: 'Review', agentType: 'reviewer', schema: REVIEW_SCHEMA }
    ).then((review) => ({ bug, fix, review }))
  }
)

// ---------------------------------------------------------------------------
// Roll up a compact report (the full agent transcripts stay in /workflows).
// ---------------------------------------------------------------------------

return {
  found: found.length,
  actioned: selected.length,
  openPr,
  results: results.filter(Boolean).map((r) => ({
    bug: r.bug?.title,
    file: r.bug?.file,
    severity: r.bug?.severity,
    fixed: r.fix?.fixed ?? false,
    branch: r.fix?.branch ?? null,
    pr: r.fix?.pr_url ?? r.fix?.pr_number ?? null,
    skipped_reason: r.fix?.skipped_reason ?? null,
    verdict: r.review?.verdict ?? null,
    review_comment: r.review?.comment_url ?? null,
    logic_errors: r.review?.logic_errors ?? [],
    review_notes: r.review?.notes ?? null
  }))
}
