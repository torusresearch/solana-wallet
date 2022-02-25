const path = require("path");

// eslint-disable-next-line import/no-extraneous-dependencies
const fetch = require("node-fetch");
require("jsdom-global")("", {
  url: "https://solana.tor.us",
});

const tsConfigPath = path.resolve(".", "tsconfig.json");

require("ts-node").register({
  project: tsConfigPath,
  require: ["tsconfig-paths/register"],
  transpileOnly: true,
  compilerOptions: { module: "commonjs" },
});

const register = require("@babel/register").default;

register({
  extensions: [".ts", ".js"],
  rootMode: "upward",
});

global.fetch = fetch;
global.Headers = fetch.Headers;
