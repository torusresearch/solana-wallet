module.exports = {
  presets: ["@vue/cli-plugin-babel/preset", "@babel/env", "@babel/typescript"],
  plugins: ["@babel/plugin-proposal-object-rest-spread", "@babel/plugin-proposal-class-properties", "@babel/transform-runtime", "lodash"],
  sourceType: "unambiguous"
};
