# Notes
Some notes and tips for people touching the code base.

- Developer commands are restricted to those whose IDs are listed in `src/utils/constants.js`
- Developer commands are marked with `devOnly: true` and are never slash commands.
- Slash commands can be deployed with `node src/deploy-commands.js` or `npm run deploy` if you prefer npm scripts. Alternatively the `deploy` developer command will deploy them right from Discord.
- The reboot commands is actually more like shutdown, it performs a reboot if you configured a process manager to do so, for example I run most of my stuff with `pm2` which will restart on exit. So that's why it's called reboot but is actually a shutdown.
