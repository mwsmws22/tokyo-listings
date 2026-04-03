import { z } from "zod";

export const geocodeStatusSchema = z.enum(["pending", "ok", "failed", "manual"]);
export const availabilitySchema = z.enum(["募集中", "契約済"]);
export const propertyTypeSchema = z.enum(["一戸建て", "アパート"]);
export const interestSchema = z.enum(["Top", "Extremely", "KindaPlus", "KindaMinus", "Nah"]);

const nonEmptyTrimmed = z.string().trim().min(1);
const optionalText = z.string().trim().min(1).max(255).optional();

const propertyFieldsSchema = z.object({
  propertyId: z.string().uuid().optional(),
  prefecture: optionalText,
  municipality: optionalText,
  town: optionalText,
  district: optionalText,
  block: optionalText,
  houseNumber: optionalText,
  propertyType: propertyTypeSchema.optional(),
  interest: interestSchema.optional(),
  pinExact: z.boolean().optional(),
});

const listingParityFieldsSchema = z.object({
  sourceUrl: z.string().url().max(2000).optional(),
  reikinMonths: z.number().min(0).max(99).optional(),
  securityDepositMonths: z.number().min(0).max(99).optional(),
  squareM: z.number().positive().max(5000).optional(),
  closestStation: optionalText,
  walkingTimeMin: z.number().int().min(0).max(600).optional(),
  availability: availabilitySchema.optional(),
});

export const listingCreateSchema = z
  .object({
    title: nonEmptyTrimmed.max(500),
    monthlyRentYen: z.number().int().positive(),
    addressText: nonEmptyTrimmed.max(2000),
    latitude: z.number().finite().optional(),
    longitude: z.number().finite().optional(),
  })
  .merge(propertyFieldsSchema)
  .merge(listingParityFieldsSchema)
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

export const listingUpdateSchema = z
  .object({
    id: z.string().uuid(),
    title: nonEmptyTrimmed.max(500).optional(),
    monthlyRentYen: z.number().int().positive().optional(),
    addressText: nonEmptyTrimmed.max(2000).optional(),
    latitude: z.number().finite().optional(),
    longitude: z.number().finite().optional(),
    geocodeStatus: geocodeStatusSchema.optional(),
  })
  .merge(propertyFieldsSchema.partial())
  .merge(listingParityFieldsSchema.partial())
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

export const listingListSchema = z.object({
  limit: z.number().int().positive().max(200).optional(),
  propertyType: propertyTypeSchema.optional(),
  availability: availabilitySchema.optional(),
  interest: interestSchema.optional(),
  prefecture: z.string().trim().max(255).optional(),
  municipality: z.string().trim().max(255).optional(),
  town: z.string().trim().max(255).optional(),
  district: z.string().trim().max(255).optional(),
  block: z.string().trim().max(255).optional(),
});

export const listingIdSchema = z.object({
  id: z.string().uuid(),
});

export const mapGeocodeSchema = z.object({
  address: z.string().min(1).max(2000),
});
