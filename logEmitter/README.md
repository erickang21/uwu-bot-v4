# logEmitter

Ships the bot's pm2 logs to a **private** mirror repo
(`erickang21/uwu-bot-logs`) so they can be read without anyone getting access
to the production VM.

The VM only ever **pushes**. Nothing connects *in* to it, so the logs mirror
adds no inbound attack surface: the worst case if the mirror is compromised is
that someone reads your logs — never a path back to the box holding `TOKEN`,
`MONGODB`, etc.

## Flow

Every minute, cron runs `main.sh`, which:

1. Resolves the pm2 out/err log paths (`pm2 jlist`, version-agnostic).
2. Strips ANSI colour codes (`strip-ansi.sh`) — `src/utils/log.js` writes escape
   codes to stdout, so the raw files are full of `\x1b[..m` noise.
3. **Redacts secrets** (`redact.sh`) — see below.
4. Tails to a bounded size (`TAIL_LINES`, default 2000 lines each).
5. Commits into a local clone of the logs repo and **force-pushes a single
   squashed commit** to `main`, so the mirror never grows history.

Output in the mirror: `out.log`, `error.log`, `last-updated.txt`.

## Files

| File                 | Role                                                       |
| -------------------- | ---------------------------------------------------------- |
| `main.sh`            | Emission script — orchestrates the whole flow.             |
| `config.sh`          | All settings, each overridable from the environment.       |
| `strip-ansi.sh`      | stdin→stdout filter: removes terminal escape sequences.    |
| `redact.sh`          | stdin→stdout filter: masks secrets (credentials/tokens).   |
| `resolve-pm2-logs.js`| Reads `pm2 jlist` JSON → prints the real log file paths.    |
| `selftest.sh`        | Verifies redaction + stripping. No network/DB/token.       |

## What is and isn't redacted

`redact.sh` masks **credentials and secrets** — anything that grants access:

- Mongo connection URIs (`mongodb://…`, `mongodb+srv://…` — user:pass\@host)
- Discord bot/MFA tokens (by shape, wherever they appear)
- Secret URL query params (`api_key`, `user_id`, `token`, …) — e.g. the Gelbooru
  request URL
- `Authorization:` / `Bearer` header values (e.g. the top.gg token)
- Named secrets dumped as `KEY=value` / `"KEY": "value"` (`TOKEN`, `MONGODB`,
  `TOPGG_API`, `GELBOORU_API*`, `CLIENT_ID`, … — covers accidental `process.env`
  dumps)

It does **not** strip operational PII (user IDs, guild names, occasional message
content). Reading those is the point of the mirror when debugging — so the
mirror **must stay private**. That privacy is the boundary protecting PII;
`redact.sh` only guarantees a leaked log line can't hand over the keys.

Verify any time with:

```bash
./selftest.sh
```

If you add a new secret anywhere, add a pattern to `redact.sh` **and** a case to
`selftest.sh`.

## Setup on the VM

1. **Create a deploy key with write access** scoped to the logs repo only
   (Settings → Deploy keys → *Allow write access*). Do **not** reuse a key that
   can reach anything else.

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/uwu_bot_logs -N "" -C "uwu-bot-logs-emitter"
   # add ~/.ssh/uwu_bot_logs.pub as a write deploy key on erickang21/uwu-bot-logs
   ```

   Point git at it (so only this repo uses the key):

   ```
   # ~/.ssh/config
   Host github-uwu-logs
     HostName github.com
     User git
     IdentityFile ~/.ssh/uwu_bot_logs
     IdentitiesOnly yes
   ```

2. **Clone the mirror** using that host alias:

   ```bash
   git clone git@github-uwu-logs:erickang21/uwu-bot-logs.git ~/uwu-bot-logs
   ```

3. **Keep the pm2 source logs bounded** so they don't grow forever:

   ```bash
   pm2 install pm2-logrotate
   ```

4. **Point the emitter at your setup.** Defaults live in `config.sh`; override
   via env in the crontab if they differ. Confirm resolution first:

   ```bash
   cd /path/to/uwu-bot-v4/logEmitter
   PM2_APP=uwu-bot LOGS_REPO_DIR=$HOME/uwu-bot-logs ./main.sh
   ```

5. **Cron it (every minute):**

   ```cron
   * * * * * PM2_APP=uwu-bot LOGS_REPO_DIR=/home/YOU/uwu-bot-logs /path/to/uwu-bot-v4/logEmitter/main.sh >> /home/YOU/logemitter.cron.log 2>&1
   ```

   `pm2` and `node` must be on `PATH` in cron. If not, set an explicit `PATH=`
   at the top of the crontab, or set `OUT_LOG`/`ERR_LOG` directly in `config.sh`
   to skip pm2 resolution entirely.

## Configuration reference

All overridable from the environment (see `config.sh` for defaults):

| Variable            | Meaning                                             |
| ------------------- | --------------------------------------------------- |
| `PM2_APP`           | pm2 app name or id used to resolve log paths.       |
| `OUT_LOG`/`ERR_LOG` | Explicit log paths; skip pm2 resolution if set.     |
| `LOGS_REPO_DIR`     | Local clone of the logs mirror to push from.        |
| `LOGS_BRANCH`       | Branch to force-push (default `main`).              |
| `TAIL_LINES`        | Lines of each log to publish (default 2000).        |
| `GIT_COMMIT_*`      | Committer identity for the mirror commits.          |

## Revoking access

- Stop shipping: remove the crontab line (or `pm2 uninstall` nothing — just the
  cron entry).
- Cut it off entirely: delete the write deploy key on the logs repo, and/or make
  the logs repo private→delete.

Nothing on the VM needs to change for a reader to lose access — it's all on the
mirror side.
