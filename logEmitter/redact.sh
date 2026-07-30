#!/usr/bin/env bash
#
# Redact secrets from stdin -> stdout before the logs ever leave the VM.
#
# SCOPE — read this before changing the patterns:
#   This filter masks *credentials and secrets*, not operational PII. The whole
#   point of the mirror is to let us read the bot's logs to debug it, and those
#   logs legitimately contain guild names, user IDs and (occasionally) message
#   content. Redacting all of that would leave nothing useful. The private
#   mirror repo is the boundary that protects that PII; this filter's job is to
#   make sure a leaked *log line* can never hand someone the keys to the VM,
#   the database, or the bot account.
#
#   Anything on this list (see .env / CLAUDE.md) must never survive:
#     TOKEN, TOKEN_DEV  - Discord bot tokens
#     MONGODB           - Mongo connection URI (has user:pass@host)
#     TOPGG_API         - sent as an Authorization header value
#     GELBOORU_API(_KEY), GELBOORU_USER_ID - go into a request URL query string
#     CLIENT_ID / DEV_CLIENT_ID
#
# The patterns are shape-based (mask a token wherever it appears) AND
# name-based (mask `KEY=value` if someone dumps process.env), so a careless
# `console.log(url)` or object dump is covered even if the exact call site is
# one we haven't seen.
set -euo pipefail

exec sed -E \
  `# --- Mongo connection URIs: mask the whole thing, creds are inside ---` \
  -e 's#mongodb(\+srv)?://[^[:space:]"'"'"'`<>]+#mongodb\1://[REDACTED_MONGODB_URI]#g' \
  `# --- Discord bot tokens: base64ish . base64ish . base64ish ---` \
  -e 's#\b[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6,7}\.[A-Za-z0-9_-]{27,}\b#[REDACTED_DISCORD_TOKEN]#g' \
  `# --- Discord MFA tokens ---` \
  -e 's#\bmfa\.[A-Za-z0-9_-]{20,}#[REDACTED_DISCORD_TOKEN]#g' \
  `# --- Secret-bearing URL query params (api_key, user_id, token, key, ...) ---` \
  -e 's#([?&](api_key|apikey|user_id|userid|token|access_token|key|auth)=)[^&[:space:]"'"'"'`<>]+#\1[REDACTED]#gi' \
  `# --- Authorization headers / bearer tokens ---` \
  -e 's#(Authorization"?[[:space:]]*[:=][[:space:]]*"?)(Bearer[[:space:]]+)?[A-Za-z0-9._~+/=-]+#\1\2[REDACTED]#gi' \
  `# --- Named secrets dumped as KEY=value or "KEY": "value" (env / object dumps) ---` \
  -e 's#\b(TOKEN(_DEV)?|MONGODB|TOPGG_API|GELBOORU_API(_KEY)?|GELBOORU_USER_ID|DEV_CLIENT_ID|CLIENT_ID)\b("?[[:space:]]*[:=][[:space:]]*"?)[^,;[:space:]"'"'"'`<>}]+#\1\4[REDACTED]#g'
