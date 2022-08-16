const path = require("path");

// eslint-disable-next-line import/no-extraneous-dependencies
const fetch = require("node-fetch");
require("jsdom-global")("", {
  url: "https://solana.tor.us",
});

global.localStorage = window.localStorage;
global.sessionStorage = window.sessionStorage;
global.open = window.open;
window.Date = Date;

require.extensions[".svg"]= (m, fileName)=> {
  console.log(fileName)
  return fileName
}

const tsConfigPath = path.resolve(".", "tsconfig.json");
require("ts-node").register({
  project: tsConfigPath,
  require: [ "tsconfig-paths/register"],
  transpileOnly: true,
  compilerOptions: { module: "commonjs" },
});


global.fetch = fetch;
global.Headers = fetch.Headers;
