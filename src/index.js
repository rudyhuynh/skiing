import * as skiingHelper from "./skiingHelper";
import fs from "fs";
import timediff from "timediff";
import path from "path";

async function main() {
  const start = Date.now();
  const file = await readFile(path.resolve(__dirname, "../data/map.txt"));

  const skiMap = skiingHelper.parseToSkiMap(file);

  console.log(`Parsed Skiing Map (${getDuration(start)}):`);
  console.log("\tx=" + skiMap.x);
  console.log("\ty=" + skiMap.y);
  console.log("\tmapLength=" + skiMap.skiMap.length);

  const result = skiingHelper.getLongestSteepestPath(skiMap);

  console.log("Result:");
  console.log(JSON.stringify(result, null, 2));
  console.log("Duration: " + getDuration(start));
}
main();

function readFile(fileName) {
  return new Promise(resolve => {
    fs.readFile(fileName, "utf8", function(err, data) {
      if (err) throw err;
      resolve(data);
    });
  });
}

function getDuration(start, end) {
  return timediff(
    new Date(start),
    end ? new Date(end) : new Date(),
    parseDurationResult
  );
}

function parseDurationResult(result) {
  const entries = Object.entries(result);
  const firstHasValueIndex = entries.findIndex(entry => entry[1] > 0);
  return entries
    .slice(firstHasValueIndex, entries.length)
    .map(entry => {
      return entry[1] + " " + entry[0];
    })
    .join(", ");
}
