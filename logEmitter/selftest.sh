#!/usr/bin/env bash
#
# selftest.sh — verify strip-ansi.sh and redact.sh do their jobs.
#
# No network, DB or token needed. Feeds known-sensitive samples through the
# filters and asserts (a) every secret shape is gone and (b) ordinary log lines
# survive intact. Run before deploying, and in CI if you wire it up.
#
#   ./selftest.sh   # prints PASS/FAIL per case, exits non-zero on any failure
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fails=0

# assert_absent <label> <needle> <text>
assert_absent() {
  if printf '%s' "$3" | grep -qF -- "$2"; then
    printf 'FAIL  %s: secret still present -> %s\n' "$1" "$2"
    fails=$((fails + 1))
  else
    printf 'PASS  %s\n' "$1"
  fi
}

# assert_present <label> <needle> <text>
assert_present() {
  if printf '%s' "$3" | grep -qF -- "$2"; then
    printf 'PASS  %s\n' "$1"
  else
    printf 'FAIL  %s: expected content was dropped -> %s\n' "$1" "$2"
    fails=$((fails + 1))
  fi
}

redact() { "$HERE/redact.sh"; }
strip()  { "$HERE/strip-ansi.sh"; }

# --- ANSI stripping ----------------------------------------------------------
# Mirrors src/utils/log.js output: "\x1b[32m[INFO 12:00:00]\x1b[0m \x1b[33m[Shard 0]\x1b[0m msg"
ansi_in=$'\x1b[32m[INFO  12:00:00]\x1b[0m \x1b[33m[Shard 0]\x1b[0m hello world'
ansi_out="$(printf '%s' "$ansi_in" | strip)"
assert_absent "ansi: escape removed" $'\x1b[' "$ansi_out"
assert_present "ansi: text kept"     "[INFO  12:00:00] [Shard 0] hello world" "$ansi_out"

# --- Mongo URI ---------------------------------------------------------------
m="$(printf 'MongoServerError connecting to mongodb+srv://uwu:s3cretPass@cluster0.abcde.mongodb.net/uwu retry' | redact)"
assert_absent  "mongo: password gone" "s3cretPass" "$m"
assert_absent  "mongo: host gone"     "cluster0.abcde.mongodb.net" "$m"
assert_present "mongo: marker"        "[REDACTED_MONGODB_URI]" "$m"

# --- Discord bot token -------------------------------------------------------
# Assembled from parts at runtime so this file never literally contains a
# token-shaped string (that would trip secret scanners / push protection).
# The joined result still matches the shape redact.sh keys off of.
tok="$(printf '%s.%s.%s' \
  AAAAAAAAAAAAAAAAAAAAAAAA BBBBBB CCCCCCCCCCCCCCCCCCCCCCCCCCC)"
d="$(printf 'Logging in with token %s now' "$tok" | redact)"
assert_absent  "discord: token gone" "$tok" "$d"
assert_present "discord: marker"     "[REDACTED_DISCORD_TOKEN]" "$d"

# --- Gelbooru-style URL query secrets ---------------------------------------
u="$(printf 'GET https://gelbooru.com/index.php?page=dapi&api_key=abc123SECRET&user_id=99887&s=post' | redact)"
assert_absent  "url: api_key gone" "abc123SECRET" "$u"
assert_absent  "url: user_id gone" "99887" "$u"
assert_present "url: host kept"    "gelbooru.com/index.php" "$u"

# --- Authorization header ----------------------------------------------------
a="$(printf 'headers: { Authorization: Bearer topggT0kenVALUE123 }' | redact)"
assert_absent  "auth: bearer gone" "topggT0kenVALUE123" "$a"

# --- process.env style dump --------------------------------------------------
e="$(printf 'env dump TOPGG_API=topggRAWkey987 MONGODB=mongodb://u:p@h/db CLIENT_ID=123' | redact)"
assert_absent "env: topgg gone"  "topggRAWkey987" "$e"
assert_absent "env: mongo pass"  "u:p@h" "$e"

# --- Ordinary log line must be untouched ------------------------------------
plain='[INFO  12:00:00] [Shard 0] command hug used in guild 372526440324923393 by user 123'
p="$(printf '%s' "$plain" | redact)"
assert_present "plain: passthrough" "$plain" "$p"

echo "----"
if [ "$fails" -eq 0 ]; then
  echo "ALL PASSED"
else
  echo "$fails CHECK(S) FAILED"
  exit 1
fi
