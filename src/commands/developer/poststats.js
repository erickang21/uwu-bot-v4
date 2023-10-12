const Command = require("../../structures/Command.js");
const { request } = require('undici');

class Poststats extends Command {
  constructor(...args) {
    super(...args, {
      description: "Posts bot stats to Top.gg",
      usage: "poststats",
      devOnly: true,
    });
  }

  async run(ctx) {
    const server_count = await this.client.getGuildCount();
    const shard_count = this.client.shard.count;
    return request(`https://top.gg/api/bots/${this.user.id}/stats`, {
      method: 'POST',
      body: JSON.stringify({ server_count, shard_count }),
      headers: {
        Authorization: process.env.TOPGG_API,
        'Content-Type': 'application/json'
      }
    })
      .then(({ statusCode }) => {
        if (statusCode !== 200) {
          const embed = this.client.embed(this.client.user)
            .setColor(0xfc0b03)
            .setTitle(`Failed to post to Top.gg.`)
            .setDescription(`**Status Code:** ${statusCode}`);
          return ctx.reply({
            embeds: [ embed ],
          });
        } else {
          const embed = this.client.embed(this.client.user)
            .setColor(0x03fc03)
            .setTitle(`Successfully posted to Top.gg!`)
            .setDescription(`**Servers:** ${server_count}\n**Shards:** ${shard_count}`);
          return ctx.reply({
            embeds: [ embed ],
          });
          
        }
      })
      .catch(err => {
        const embed = this.client.embed(this.client.user)
          .setColor(0xfc0b03)
          .setTitle(`An error occurred with this process.`)
          .setDescription(`**Error:** \n\n\`\`\`${err}\`\`\``);
        return ctx.reply({
          embeds: [ embed ],
        });
      });
    
  }


}

module.exports = Poststats;
