import { createThemes } from "@tamagui/theme-builder";

/**
 * Rosé Pine — three variants, 12-step scales each (background at index 0 → foreground at 11).
 * Hex values from the official palette: https://rosepinetheme.com/palette/ingredients/
 *
 * Built with `createThemes` from `@tamagui/theme-builder` (same pattern as the upstream “full example”):
 * https://tamagui.dev/docs/guides/theme-builder
 */
const rosePineMain12 = [
  "#191724",
  "#21202e",
  "#1f1d2e",
  "#26233a",
  "#403d52",
  "#524f67",
  "#6e6a86",
  "#908caa",
  "#ebbcba",
  "#eb6f92",
  "#31748f",
  "#e0def4",
] as const;

const rosePineMoon12 = [
  "#232136",
  "#2a283e",
  "#2a273f",
  "#393552",
  "#44415a",
  "#56526e",
  "#6e6a86",
  "#908caa",
  "#ea9a97",
  "#eb6f92",
  "#3e8fb0",
  "#e0def4",
] as const;

const rosePineDawn12 = [
  "#faf4ed",
  "#f4ede8",
  "#fffaf3",
  "#f2e9e1",
  "#dfdad9",
  "#cecacd",
  "#9893a5",
  "#797593",
  "#d7827e",
  "#ea9d34",
  "#56949f",
  "#575279",
] as const;

const suite = createThemes({
  base: {
    palette: {
      light: [...rosePineDawn12],
      dark: [...rosePineMain12],
    },
  },
  childrenThemes: {
    moon: {
      palette: [...rosePineMoon12],
    },
  },
});

/** Named themes for `TamaguiProvider` / `<Theme name="…">`. */
export const rosePineThemes = {
  "rose-pine": suite.dark,
  "rose-pine-moon": suite.dark_moon,
  "rose-pine-dawn": suite.light,
} as const;

export type RosePineThemeName = keyof typeof rosePineThemes;
