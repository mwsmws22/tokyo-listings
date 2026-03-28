import { defaultConfig } from "@tamagui/config/v3";
import { createTamagui } from "tamagui";

const config = createTamagui(defaultConfig);

export type AppConfig = typeof config;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
