import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";
import { rosePineThemes } from "@/themes";

const appConfig = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    ...rosePineThemes,
  },
});

export type AppConfig = typeof appConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
