const strings = require("../lang/en.js");

function translate(str) {
    const props = str.split(".");
    let prev = strings;
    while (props.length) {
        const prop = props.shift();
        prev = prev[prop];
        if (!prev) throw strings.error.translate;
    }
    return prev;
}

module.exports = translate;
