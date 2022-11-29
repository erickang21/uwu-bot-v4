const Event = require("../structures/Event.js");

class ReadyEvent extends Event {
	async run() {
		const { user, log } = this.client;
		const guilds = await this.client.getGuildCount();

		log.info(`Logged in as ${user.tag} (${user.id})`);
		log.info(`Bot is in ${guilds} servers.`);
		this.client.setActivity();
	}
}

module.exports = ReadyEvent;
