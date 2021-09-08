const lighten = (color, val) =>
  require("color")(color).lighten(val).rgb().string();

const tailwindColors = require("tailwindcss/colors");
const appColors = {
  primary: "#0021A5",
};

module.exports = {
  purge: ["index.html", "src/**/*.{ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        header: ["Poppins"],
        body: ["DM Sans"],
      },
      colors: {
        app: {
          primary: {
            100: lighten(appColors.primary, 0.8),
            200: lighten(appColors.primary, 0.64),
            300: lighten(appColors.primary, 0.4),
            400: lighten(appColors.primary, 0.24),
            500: appColors.primary,
          },
          secondary: "#47B2FD",
          secondary2: "#DAF0FF",
          gray: {
            200: "#F5F5F5",
            300: "#F9F9FB",
            400: "#F3F3F4",
            500: "#B7B8BD",
            600: "#6F717A",
            700: "#0F1222",
          },
        },
      },
      boxShadow: {
        DEFAULT: "0px 14px 28px rgba(46, 91, 255, 0.06)",
        inner: "inset 0px 4px 28px rgba(46, 91, 255, 0.06)",
      },
    },
  },
  variants: {
    extend: {
      opacity: ["disabled"],
      backgroundColor: ["disabled", "active"],
      textColor: ["disabled", "active"],
      borderColor: ["disabled"],
      outline: ["focus"],
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
