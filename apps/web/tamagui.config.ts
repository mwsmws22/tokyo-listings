import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

const appConfig = createTamagui(defaultConfig);

export type AppConfig = typeof appConfig;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
