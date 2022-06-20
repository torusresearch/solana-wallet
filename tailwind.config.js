const lighten = (color, val) =>
  require("color")(color).lighten(val).rgb().string();

const darken = (color, val) =>
  require("color")(color).darken(val).rgb().string();

const tailwindColors = require("tailwindcss/colors");
const appColors = {
  primary: "#9945ff",
};

module.exports = {
  content: [
    "public/index.html",
    "src/**/*.{ts,tsx,jsx,js,vue}",
    "node_modules/\\@toruslabs/**/*.{ts,tsx,jsx,js,vue}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        header: ["Poppins"],
        body: ["DM Sans"],
      },
      fontSize: {
        xxs: "0.625rem",
      },
      colors: {
        app: {
          primary: {
            100: lighten(appColors.primary, 0.8),
            200: lighten(appColors.primary, 0.64),
            300: lighten(appColors.primary, 0.4),
            400: lighten(appColors.primary, 0.24),
            500: appColors.primary,
            600: darken(appColors.primary, 0.24),
            700: darken(appColors.primary, 0.4),
            800: darken(appColors.primary, 0.64),
            900: darken(appColors.primary, 0.8),
          },
          secondary: "#47B2FD",
          secondary2: "#DAF0FF",
          text: {
            400: "#A2A5B5",
            500: "#5C6C7F",
            600: "#0F1222",
            accent: appColors.primary,
            dark: {
              white: "#FFFFFF",
              400: "#EEF2F4",
              500: "#D3D3D4",
              600: "#B3C0CE",
            },
          },
          gray: {
            200: "#F9F9FB",
            300: "#F5F5F5",
            400: "#B7B8BD",
            500: "#6F717A",
            600: "#595857",
            700: "#2f3136",
            800: "#252529",
            900: "#0F1222",
          },
          success: "#30CCA4",
          warning: "#FBC94A",
          error: "#FB4A61",
          info: "#D4D4D4",
          green: tailwindColors.emerald,
          yellow: tailwindColors.amber,
          purple: tailwindColors.violet,
          current: "currentColor",
        },
      },
      boxShadow: {
        DEFAULT: "0px 14px 28px rgba(46, 91, 255, 0.06)",
        inner: "inset 0px 4px 28px rgba(46, 91, 255, 0.06)",
        dark: "0px 14px 28px rgba(92, 108, 127, 0.06);",
        dark2: "5px 5px 10px #212121, -5px -5px 10px rgb(55 56 60 / 25%)",
      },
      backgroundImage: {
        "gradient-conic": "conic-gradient(transparent, var(--tw-gradient-to))",
      },
      screens: {
        "gt-xs": { min: "440px" }, // mobile
        "lt-sm": { max: "640px" }, // less than sm
        "lt-md": { max: "768px" }, // less than md
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
