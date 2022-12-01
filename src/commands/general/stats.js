const Command = require("../../structures/Command.js");
const { EmbedBuilder, version } = require("discord.js");
const { DEVS } = require("../../utils/constants.js");

class Stats extends Command {
    constructor(...args) {
        super(...args, {
            description: "Shows invite information for uwu bot.",
            aliases: ["info"]
        });
    }
    
    async run(ctx) {
        const { client } = this; 
    
        const seconds = Math.floor(client.uptime / 1000) % 60 ;
        const minutes = Math.floor((client.uptime / (1000 * 60)) % 60);
        const hours = Math.floor((client.uptime / (1000 * 60 * 60)) % 24);
        const days = Math.floor((client.uptime / (1000 * 60 * 60 * 24)) % 7);
        const uptime = [
          `${days} Days`,
          `${hours} hours`,
          `${minutes} minutes`,
          `${seconds} seconds`
        ].filter(time => !time.startsWith("0")).join(", ");
        const guildCount = await this.client.getGuildCount();
        const users = await this.client.shard.broadcastEval(c => c.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0));
        const totalUsers = users.reduce((a, b) => a + b, 0);
        let memUsage = await this.client.shard.broadcastEval(() => process.memoryUsage().heapUsed / 1024 / 1024);
        memUsage = memUsage.reduce((a, b) => a + b, 0).toFixed(2);
        let devList = [];
        for (const d of DEVS) {
          let test = await this.client.users.fetch(d)
          devList.push(test.tag)
        }
        const embed = this.client.embed(this.client.user)
          .setTitle("uwu bot")
          .setDescription("A very useful Discord bot for all your server's needs!")
          .addFields(
              {name: "Shard <:powercube:783783098163658783>", value: `**${ctx.guild.shard.id + 1}** of **${this.client.shard.count}**`},
              {name: "Servers <:trustedDBB:559115961421266965>", value: `${guildCount}`},
              {name: "Users <:invite:849404519937867809> ", value: `${totalUsers}`},
              {name: "Average Users/Server <:EARLY_SUPPORTER:715216600873304237>", value: `${Math.floor(totalUsers / guildCount)}`},
              {name: "Uptime <a:OnMyWay:874325709106057257>", value: uptime},
              {name: "Memory <a:EQ:559923444234584064>", value: `${memUsage} MB`},
              {name: "Commands <:Trophy:645620279439130639>", value: `${this.store.size}`},
              {name: "Commands Run (since uptime) :chart_with_upwards_trend:", value: `${this.store.ran}`},
              {name: "Node.js Version <:Nodejs:550362497945829378>", value: process.version},
              {name: "Discord.js Version <:discord:749665645590741023>", value: `v${version}`},
              {name: "Bot Links", value: [
                "<:DBL:829408131531931679> [Top.gg Page](https://top.gg/bot/520682706896683009)",
                "<:Docs:829408832441679933> [Documentation](https://docs.uwubot.tk)"
              ].join("\n")},
              {name: "Socials", value: [
              "<:discord:749665645590741023> [banana's hideout ♡](https://discord.gg/vCMEmNJ)",
              "<:youtube:829407559063437342> [banana bs](https://www.youtube.com/channel/UC6No09LRXzCk8omS1CMnzSw)",
              "<:twitter:749665645573963847> [itzbananauwu](https://twitter.com/itzbananauwu)",
              "<:twitch:749665645477756960> [itzbananauwu](https://www.twitch.tv/itzbananauwu)",
              "<:github:749666788832313415> [erickang21](https://github.com/itzbananauwu)"
              ].join("\n")},
              {name: "Developers", value: devList.join("\n")});
    
        return ctx.reply({ embeds: [embed] })
      }
}
    
module.exports = Stats;
    