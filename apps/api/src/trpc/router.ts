import { listingRouter } from "./routers/listing";
import { mapRouter } from "./routers/map";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
  listing: listingRouter,
  map: mapRouter,
});

export type AppRouter = typeof appRouter;
