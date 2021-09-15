const lighten = (color, val) =>
  require("color")(color).lighten(val).rgb().string();

const tailwindColors = require("tailwindcss/colors");
const appColors = {
  primary: "#70a3ff",
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
          },
          secondary: lighten(appColors.primary, 0.24),
          secondary2: lighten(appColors.primary, 0.4),
          text: {
            400: "#A2A5B5",
            500: "#5C6C7F",
            600: "#0F1222",
            dark: {
              400: "#EEF2F4",
              500: "#D3D3D4",
              600: "#B3C0CE",
            },
          },
          gray: {
            200: "#F5F5F5",
            300: "#F9F9FB",
            400: "#F3F3F4",
            500: "#B7B8BD",
            600: "#6F717A",
            700: "#2f3136",
            800: "#252529",
            900: "#0F1222",
          },
        },
      },
      boxShadow: {
        DEFAULT: "0px 14px 28px rgba(46, 91, 255, 0.06)",
        inner: "inset 0px 4px 28px rgba(46, 91, 255, 0.06)",
        dark: "0 14px 28px rgba(0,0,0,0.16)",
        dark2: "5px 5px 10px #212121, -5px -5px 10px rgb(55 56 60 / 25%)",
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
      boxShadow: ["dark"],
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
