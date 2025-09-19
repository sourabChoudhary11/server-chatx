import util from "util"

const { colors } = util.inspect;

export function colorize(text, colorName) {
    const [open, close] = colors[colorName];
    return `\u001b[${open}m${text}\u001b[${close}m`;
}