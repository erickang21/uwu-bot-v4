require("dotenv").config();
const { ShardingManager } = require("discord.js");
const token = process.env.DEV ? process.env.TOKEN_DEV : process.env.TOKEN;

const manager = new ShardingManager("./src/index.js", { token });

manager.on("shardCreate", shard => {
  console.log(`Launched shard ${shard.id}`);
});

manager.spawn();