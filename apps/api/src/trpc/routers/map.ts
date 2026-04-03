import { mapGeocodeSchema } from "@tokyo-listings/validators/listing";
import { TRPCError } from "@trpc/server";
import { geocodeAddress } from "../../lib/geocoding";
import { protectedProcedure, router } from "../trpc";

export const mapRouter = router({
  geocode: protectedProcedure.input(mapGeocodeSchema).query(async ({ input }) => {
    const result = await geocodeAddress(input.address);
    if (!result) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Geocoding failed. Check the address, GOOGLE_MAPS_API_KEY_SERVER, and Geocoding API enablement.",
      });
    }
    return result;
  }),
});
