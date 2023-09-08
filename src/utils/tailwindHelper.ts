// eslint-disable-next-line import/no-extraneous-dependencies
import resolveConfig from "tailwindcss/resolveConfig";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import tailwindConfig from "../../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);

export const getTailwindColor = (colorCode: string, colorCodePalette: number) => {
  return colorCodePalette ? fullConfig.theme.colors.app[colorCode][colorCodePalette] : fullConfig.theme.colors.app[colorCode];
};
