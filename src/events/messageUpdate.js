const Event = require("../structures/Event.js");

class MessageUpdate extends Event {
  async run(oldMsg, newMsg) {
    if (newMsg.content && newMsg.content !== oldMsg.content) {
      // Trigger the messageCreate event to handle commands.
      return this.client.commands.handler.handleMessage(newMsg);
    }
  }
}

module.exports = MessageUpdate;
