#!/usr/bin/env bash
#
# main.sh — emit the bot's pm2 logs to the private mirror repo.
#
# Flow (all push, never pull — the VM is never reachable from outside):
#   1. resolve the pm2 out/err log file paths
#   2. strip ANSI escape codes           (strip-ansi.sh)
#   3. redact secrets                     (redact.sh)
#   4. tail to a bounded size
#   5. commit into the local logs-repo clone and force-push a single commit
#
# Intended to run from cron every minute. Safe to run by hand.
#
# Exit codes: 0 = shipped or nothing to do, non-zero = a step failed.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config.sh
source "$HERE/config.sh"

log() { printf '[logEmitter] %s\n' "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

# --- 1. resolve pm2 log paths ------------------------------------------------

if [ -z "$OUT_LOG" ] || [ -z "$ERR_LOG" ]; then
  if command -v pm2 >/dev/null 2>&1; then
    resolved="$(pm2 jlist 2>/dev/null | node "$HERE/resolve-pm2-logs.js" "$PM2_APP" || true)"
    if [ -n "$resolved" ]; then
      [ -z "$OUT_LOG" ] && OUT_LOG="$(printf '%s' "$resolved" | cut -f1)"
      [ -z "$ERR_LOG" ] && ERR_LOG="$(printf '%s' "$resolved" | cut -f2)"
    fi
  fi
fi

[ -n "$OUT_LOG" ] || [ -n "$ERR_LOG" ] || \
  die "could not resolve pm2 log paths for app '$PM2_APP' (set OUT_LOG/ERR_LOG in config.sh or env)"

# --- helper: clean + bound one source file into the mirror ------------------

emit() {
  local src="$1" dest="$2"
  if [ -n "$src" ] && [ -f "$src" ]; then
    # strip escapes, then redact, then keep only the tail. If any stage fails,
    # write nothing rather than risk shipping un-redacted content.
    if ! "$HERE/strip-ansi.sh" < "$src" \
        | "$HERE/redact.sh" \
        | tail -n "$TAIL_LINES" > "$dest.tmp"; then
      rm -f "$dest.tmp"
      die "failed to process $src (writing $dest); shipped nothing for it"
    fi
    mv "$dest.tmp" "$dest"
  else
    : > "$dest" # keep a present-but-empty file so the mirror is predictable
  fi
}

# --- 2-4. build the redacted, bounded files inside the mirror clone ---------

[ -d "$LOGS_REPO_DIR/.git" ] || \
  die "LOGS_REPO_DIR '$LOGS_REPO_DIR' is not a git clone of the logs repo"

emit "$OUT_LOG" "$LOGS_REPO_DIR/out.log"
emit "$ERR_LOG" "$LOGS_REPO_DIR/error.log"

# A tiny freshness marker (UTC). No hostname/paths — nothing VM-identifying.
date -u +'updated: %Y-%m-%dT%H:%M:%SZ' > "$LOGS_REPO_DIR/last-updated.txt"

# --- 5. commit + force-push a single squashed commit ------------------------

cd "$LOGS_REPO_DIR"

git add -A

# Skip the push entirely if only the timestamp changed (bot idle, no new logs).
if git diff --cached --quiet -- out.log error.log; then
  git reset -q -- last-updated.txt >/dev/null 2>&1 || true
  git checkout -q -- last-updated.txt >/dev/null 2>&1 || true
  log "no new log content; nothing to push"
  exit 0
fi

msg="logs: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"

# Keep history at one commit: amend onto the existing tip, or make the first
# commit if the mirror is still empty. Then force-push.
if git rev-parse --verify -q HEAD >/dev/null; then
  git -c user.name="$GIT_COMMIT_NAME" -c user.email="$GIT_COMMIT_EMAIL" \
    commit -q --amend -m "$msg"
else
  git -c user.name="$GIT_COMMIT_NAME" -c user.email="$GIT_COMMIT_EMAIL" \
    commit -q -m "$msg"
fi

# Ensure we are on the configured branch name before pushing.
git branch -q -M "$LOGS_BRANCH"

attempt=0
until git push -f -u origin "$LOGS_BRANCH"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 4 ]; then
    die "git push failed after $attempt attempts"
  fi
  sleep "$((1 << attempt))" # 2s, 4s, 8s
done

log "shipped ($msg)"
