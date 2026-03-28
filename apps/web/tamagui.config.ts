import { config as tamaguiV3 } from "@tamagui/config/v3";
import { createTamagui } from "tamagui";

const config = createTamagui(tamaguiV3);

export type AppConfig = typeof config;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
