import type { AppRouter } from "@api/trpc/router";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
