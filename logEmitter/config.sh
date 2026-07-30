# shellcheck shell=bash
# Configuration for the log emitter. Sourced by main.sh.
#
# Every value can be overridden from the environment (crontab / shell) so the
# checked-in defaults stay generic and nothing VM-specific lives in the repo.
# Override by exporting the variable before invoking main.sh, e.g.
#   PM2_APP=uwu-bot LOGS_REPO_DIR=/home/uwu/uwu-bot-logs ./main.sh

# ---------------------------------------------------------------------------
# Source: where pm2 writes the bot's logs
# ---------------------------------------------------------------------------

# The pm2 app name (the "name" column in `pm2 ls`) or its numeric id. Used to
# resolve the real log file paths via `pm2 jlist`, so this survives pm2's
# per-version filename scheme (`<name>-out.log`, `<name>-out-<id>.log`, ...).
PM2_APP="${PM2_APP:-uwu-bot}"

# Explicit overrides. Leave empty to auto-resolve from `pm2 jlist`. Set these
# only if you don't want to depend on pm2 being on PATH in cron.
OUT_LOG="${OUT_LOG:-}"
ERR_LOG="${ERR_LOG:-}"

# ---------------------------------------------------------------------------
# Destination: the private logs mirror repo (a local clone that we push from)
# ---------------------------------------------------------------------------

# Absolute path to a local clone of the private erickang21/uwu-bot-logs repo.
# The VM's deploy key must have push access to it. We only ever push; nothing
# reads back into the VM.
LOGS_REPO_DIR="${LOGS_REPO_DIR:-$HOME/uwu-bot-logs}"

# Branch we force-push. History is squashed to a single commit each run
# (amend + force-push) so the mirror never bloats.
LOGS_BRANCH="${LOGS_BRANCH:-main}"

# Committer identity used for the mirror commits (kept off any real account).
GIT_COMMIT_NAME="${GIT_COMMIT_NAME:-uwu-log-emitter}"
GIT_COMMIT_EMAIL="${GIT_COMMIT_EMAIL:-log-emitter@users.noreply.github.com}"

# ---------------------------------------------------------------------------
# Shape of what we ship
# ---------------------------------------------------------------------------

# How many trailing lines of each log to publish. Keeps files small and bounds
# how far back the mirror exposes.
TAIL_LINES="${TAIL_LINES:-2000}"
