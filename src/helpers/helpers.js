function parseOptions(ctx) {
    if (ctx.slash) {
        const args = ctx.interaction.options.data;
        return args.map((arg) => arg.value).join(" ");
    } else {
        return "";
    }
}

function getMessageContent(ctx) {
    if (ctx.slash) {
        const commandName = ctx.interaction.commandName;
        const args = parseOptions(ctx);
        return `/${commandName} ${args}`;
    } else {
        return ctx.content;
    }
}

module.exports = {
    getMessageContent
};
