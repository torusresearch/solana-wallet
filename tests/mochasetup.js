const path = require("path");

// eslint-disable-next-line import/no-extraneous-dependencies
const fetch = require("node-fetch");
require("jsdom-global")();

const tsConfigPath = path.resolve(".", "tsconfig.test.json");
// eslint-disable-next-line import/no-extraneous-dependencies
require("ts-node").register({
  project: tsConfigPath,
  require: ["tsconfig-paths/register"],
  transpileOnly: true,
  compilerOptions: { module: "CommonJS" },
});

// const register = require("@babel/register").default;

// register({
//   extensions: [".ts", ".js"],
//   rootMode: "upward",
// });

global.fetch = fetch;
global.Headers = fetch.Headers;
