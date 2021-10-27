const path = require("path");
const pkg = require("./package.json");
const {ProvidePlugin} = require("webpack");

const p = require('path');
module.exports = {
    pages: {
        index: {
            entry: path.join("src", "main.ts"),
            title: pkg.app.name,
        },
    },
    configureWebpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            crypto: require.resolve("crypto-browserify"),
            stream: require.resolve("stream-browserify"),
            assert: require.resolve("assert"),
            os: require.resolve("os-browserify/browser"),
            https: require.resolve("https-browserify"),
            http: require.resolve("stream-http"),
        };
        config.resolve.alias = {
            ...config.resolve.alias,
            'bn.js': p.join(__dirname, 'node_modules/bn.js/lib/bn.js'), // used as peer dep multiple times, duplicate present in bundle
        }
        config.plugins.push(new ProvidePlugin({Buffer: ["buffer", "Buffer"]}));
        config.plugins.push(new ProvidePlugin({process: ["process/browser"]}));
        },
    pwa: {
        name: "Solana Wallet",
        themeColor: "#70a3ff",
        msTileColor: "#000000",
        appleMobileWebAppCapable: "yes",
        appleMobileWebAppStatusBarStyle: "black",
        iconPaths: {
            faviconSVG: "img/icons/favicon.svg",
            favicon32: "img/icons/favicon-32x32.png",
            favicon16: "img/icons/favicon-16x16.png",
            appleTouchIcon: "img/icons/apple-touch-icon-152x152.png",
            maskIcon: "img/icons/safari-pinned-tab.svg",
            msTileImage: "img/icons/msapplication-icon-144x144.png",
        },
    },
    productionSourceMap: false
};
