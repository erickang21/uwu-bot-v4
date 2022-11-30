# Notes

Some notes and tips for people touching the code base.

- Developer commands are restricted to those whose IDs are listed in `src/utils/constants.js`
- Developer commands are marked with `devOnly: true` and are never slash commands.
- Slash commands can be deployed with `node src/deploy-commands.js` or `npm run deploy` if you prefer npm scripts. Alternatively the `deploy` developer command will deploy them right from Discord.
- The reboot command is actually more like shutdown, it performs a reboot if you configured a process manager to do so, for example I run most of my stuff with `pm2` which will restart on exit. So that's why it's called reboot but is actually a shutdown.
- The bot can be launched via either the top-level `index.js` or `src/index.js` the top-level file will launch it with a sharding manager and spawn shards while the `src/index.js` if ran directly will start the bot without sharding. In development either is fine and the code is designed to handle both cases so sharding is not necessarily hard coded.

## HTTP Requests

When porting commands that use an API or does an http request, switch to using `undici`. Previously we used `node-fetch` just because it was a dependency of discord.js so we got it for free. Today discord.js no longer uses `node-fetch` and in fact `fetch` is available as a Node.js builtin since Node.js v18 but discord.js currently uses `undici` which is also by the Node.js team I believe, it is a better and faster client written from scratch, so make sure to use these for http requests from now on.

Usage is very simple:

```js
const { request } = require("undici");

const data = await request("url").then(({ body }) => body.json());
```

Most of the time all you need to change is:

```diff
- const fetch = require("node-fetch");
+ const { request } = require("undici")
- fetch(url)
+ request(url)
-   .then((res) => res.json())
+   .then(({ body }) => body.json)
```

The response body is basically inside a `.body` property, you can use `res.body.json()` as well but I feel the de-structuring syntax is clean here.

That should be all you need to switch from `node-fetch` (most of the time), consult the documentation if more info is needed.
