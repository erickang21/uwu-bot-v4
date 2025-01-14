require("dotenv").config();
const { ShardingManager } = require("discord.js");
const token = process.env.NODE_ENV == "development" ? process.env.TOKEN_DEV : process.env.TOKEN;

const manager = new ShardingManager("./src/index.js", { 
  token, 
  totalShards: "auto",
  respawn: true,
});

manager.on("shardCreate", (shard) => {
  console.log(`Launched shard ${shard.id}`);
});

manager.spawn({ amount: 'auto', delay: 5500, timeout: Infinity }).catch(e => console.log(`An error occured with spawning a shard. ${e}`));
