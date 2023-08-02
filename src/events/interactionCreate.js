const Event = require("../structures/Event.js");

class InteractionCreate extends Event {
  async run(interaction) {
    return this.client.commands.handler.handleInteraction(interaction);
  }
}

module.exports = InteractionCreate;
