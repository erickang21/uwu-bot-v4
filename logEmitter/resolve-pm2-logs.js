// Resolve a pm2 app's out/err log file paths in a pm2-version-agnostic way.
//
// pm2's on-disk log filenames vary by version (`<name>-out.log`,
// `<name>-out-<id>.log`, custom paths from an ecosystem file, ...). Rather than
// guess, we ask pm2 itself: `pm2 jlist` prints the authoritative paths in
// pm_env.pm_out_log_path / pm_err_log_path.
//
// Usage:  pm2 jlist | node resolve-pm2-logs.js <app-name-or-id>
// Prints: "<out_log_path>\t<err_log_path>"  (empty line if it can't resolve)
"use strict";

const target = process.argv[2];

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let list;
  try {
    list = JSON.parse(raw);
  } catch {
    process.exit(0); // no/invalid pm2 output; caller falls back to config
  }
  if (!Array.isArray(list) || list.length === 0) process.exit(0);

  const proc =
    list.find(
      (p) => String(p.name) === target || String(p.pm_id) === target
    ) || list[0];

  const env = proc && proc.pm2_env ? proc.pm2_env : {};
  const out = env.pm_out_log_path || "";
  const err = env.pm_err_log_path || "";
  if (!out && !err) process.exit(0);

  process.stdout.write(`${out}\t${err}\n`);
});
