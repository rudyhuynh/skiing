var readline = require("readline");

export function logOneLine(content) {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(content);
}
