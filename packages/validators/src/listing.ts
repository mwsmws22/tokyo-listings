import { z } from "zod";

export const geocodeStatusSchema = z.enum(["pending", "ok", "failed", "manual"]);

export const listingCreateSchema = z.object({
  title: z.string().min(1).max(500),
  monthlyRentYen: z.number().int().positive(),
  addressText: z.string().min(1).max(2000),
});

export const listingUpdateSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(500).optional(),
    monthlyRentYen: z.number().int().positive().optional(),
    addressText: z.string().min(1).max(2000).optional(),
    latitude: z.number().finite().optional(),
    longitude: z.number().finite().optional(),
    geocodeStatus: geocodeStatusSchema.optional(),
  })
  .superRefine((val, ctx) => {
    const hasLat = val.latitude !== undefined;
    const hasLng = val.longitude !== undefined;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "latitude and longitude must both be set or both omitted",
        path: hasLat ? ["longitude"] : ["latitude"],
      });
    }
  });

/** List filters — extended in US4 (rent range, tags, etc.) */
export const listingListSchema = z.object({
  limit: z.number().int().positive().max(200).optional(),
});

export const listingIdSchema = z.object({
  id: z.string().uuid(),
});

export const mapGeocodeSchema = z.object({
  address: z.string().min(1).max(2000),
});
