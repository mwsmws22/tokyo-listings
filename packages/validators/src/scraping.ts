import { z } from "zod";
import { portalIdSchema } from "./listing";

export { portalIdSchema };

const fetchErrorCodeSchema = z.enum([
  "timeout",
  "too_large",
  "http_error",
  "invalid_url",
  "network",
]);

const scrapedPropertyTypeSchema = z.enum(["一戸建て", "アパート"]);
const scrapedAvailabilitySchema = z.enum(["募集中", "契約済"]);

export const scrapedListingDraftSchema = z.object({
  title: z.string().optional(),
  monthlyRentYen: z.number().optional(),
  propertyType: scrapedPropertyTypeSchema.optional(),
  availability: scrapedAvailabilitySchema.optional(),
  addressText: z.string().optional(),
  squareM: z.number().optional(),
  closestStation: z.string().optional(),
  walkingTimeMin: z.number().optional(),
  reikinMonths: z.number().optional(),
  securityDepositMonths: z.number().optional(),
  prefecture: z.string().optional(),
  municipality: z.string().optional(),
  town: z.string().optional(),
  district: z.string().optional(),
  block: z.string().optional(),
  houseNumber: z.string().optional(),
  warnings: z.array(z.string()),
  fieldErrors: z.record(z.string()).optional(),
});

export const scrapingPreviewInputSchema = z.object({
  url: z.string().url().max(2000),
});

export const scrapingPreviewOutputSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    portal: portalIdSchema,
    canonicalUrl: z.string(),
    draft: scrapedListingDraftSchema,
  }),
  z.object({
    status: z.literal("partial"),
    portal: portalIdSchema,
    canonicalUrl: z.string(),
    draft: scrapedListingDraftSchema,
  }),
  z.object({
    status: z.literal("unsupported_host"),
    canonicalUrl: z.string(),
    message: z.string(),
  }),
  z.object({
    status: z.literal("fetch_failed"),
    canonicalUrl: z.string(),
    message: z.string(),
    code: fetchErrorCodeSchema.optional(),
  }),
  z.object({
    status: z.literal("parse_failed"),
    portal: portalIdSchema,
    canonicalUrl: z.string(),
    message: z.string(),
  }),
]);

export type ScrapingPreviewInput = z.infer<typeof scrapingPreviewInputSchema>;
export type ScrapingPreviewOutput = z.infer<typeof scrapingPreviewOutputSchema>;
