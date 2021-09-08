const path = require("path");
const pkg = require("./package.json");

module.exports = {
  pages: {
    index: {
      entry: path.join("src", "main.ts"),
      title: pkg.app.name,
    },
  },
};
