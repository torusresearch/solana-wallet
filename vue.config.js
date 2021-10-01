const path = require("path");
const pkg = require("./package.json");
const { ProvidePlugin } = require("webpack");
module.exports = {
  pages: {
    index: {
      entry: path.join("src", "main.ts"),
      title: pkg.app.name,
    },
  },
  configureWebpack: (config) => {
    config.resolve.fallback = {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      assert: require.resolve("assert"),
      os: require.resolve("os-browserify/browser"),
      https: require.resolve("https-browserify"),
      http: require.resolve("stream-http"),
    };
    config.plugins.push(new ProvidePlugin({ Buffer: ["buffer", "Buffer"] }));
    config.plugins.push(new ProvidePlugin({ process: ["process/browser"] }));
  },
};
