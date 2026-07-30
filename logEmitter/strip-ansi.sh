#!/usr/bin/env bash
#
# Strip terminal control sequences from stdin -> stdout.
#
# src/utils/log.js writes ANSI colour codes to stdout (e.g. "\x1b[32m[INFO ...")
# so the raw pm2 log files are full of escape noise that is useless in a text
# mirror and, worse, defeats grep. This filter removes them.
#
# Handles:
#   - CSI sequences   ESC [ ... final-byte   (colours, cursor moves, erase, ...)
#   - OSC sequences   ESC ] ... BEL|ESC\     (window titles, etc.)
#   - lone C1 escapes ESC followed by a single byte
#
# Usage:  strip-ansi.sh < in.log   |   ...
set -euo pipefail

exec sed -E \
  -e 's/\x1b\[[0-9;?]*[ -/]*[@-~]//g' \
  -e 's/\x1b\][^\x07\x1b]*(\x07|\x1b\\)//g' \
  -e 's/\x1b[@-Z\\-_]//g' \
  -e 's/\x1b//g'
