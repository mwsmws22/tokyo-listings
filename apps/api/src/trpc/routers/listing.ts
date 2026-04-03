import { listing, property } from "@tokyo-listings/db";
import {
  listingCreateSchema,
  listingIdSchema,
  listingListSchema,
  listingUpdateSchema,
} from "@tokyo-listings/validators/listing";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { geocodeAddress } from "../../lib/geocoding";
import { buildListingWhereClause } from "../../lib/listing-filters";
import { protectedProcedure, router } from "../trpc";

function requireUserId(userId: string | null): string {
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return userId;
}

export const listingRouter = router({
  create: protectedProcedure.input(listingCreateSchema).mutation(async ({ ctx, input }) => {
    const userId = requireUserId(ctx.userId);

    const coords = await geocodeAddress(input.addressText);
    const hasKey = Boolean(process.env.GOOGLE_MAPS_API_KEY_SERVER?.trim());
    const propertyPayload = {
      prefecture: input.prefecture ?? null,
      municipality: input.municipality ?? null,
      town: input.town ?? null,
      district: input.district ?? null,
      block: input.block ?? null,
      houseNumber: input.houseNumber ?? null,
      propertyType: input.propertyType ?? null,
      interest: input.interest ?? null,
      latitude: input.latitude ?? coords?.lat ?? null,
      longitude: input.longitude ?? coords?.lng ?? null,
      pinExact: input.pinExact ? 1 : 0,
      updatedAt: new Date(),
    };
    const hasStructuredProperty = Boolean(
      input.prefecture ||
        input.municipality ||
        input.town ||
        input.district ||
        input.block ||
        input.houseNumber ||
        input.propertyType ||
        input.interest,
    );

    let propertyId = input.propertyId ?? null;
    if (!propertyId && hasStructuredProperty) {
      const [createdProperty] = await ctx.db
        .insert(property)
        .values({
          userId,
          ...propertyPayload,
        })
        .returning({ id: property.id });
      propertyId = createdProperty?.id ?? null;
    }

    const [row] = await ctx.db
      .insert(listing)
      .values({
        userId,
        propertyId,
        title: input.title,
        monthlyRentYen: input.monthlyRentYen,
        addressText: input.addressText,
        latitude: input.latitude ?? coords?.lat ?? null,
        longitude: input.longitude ?? coords?.lng ?? null,
        geocodeStatus: (coords ? "ok" : hasKey ? "failed" : "pending") as
          | "pending"
          | "ok"
          | "failed",
        sourceUrl: input.sourceUrl ?? null,
        reikinMonths: input.reikinMonths?.toString() ?? null,
        securityDepositMonths: input.securityDepositMonths?.toString() ?? null,
        squareM: input.squareM?.toString() ?? null,
        closestStation: input.closestStation ?? null,
        walkingTimeMin: input.walkingTimeMin ?? null,
        availability: input.availability ?? null,
      })
      .returning();

    if (!row) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create listing" });
    }

    return row;
  }),

  list: protectedProcedure.input(listingListSchema).query(async ({ ctx, input }) => {
    const userId = requireUserId(ctx.userId);
    const limit = input.limit ?? 100;

    const rows = await ctx.db
      .select({
        listing,
        property,
      })
      .from(listing)
      .leftJoin(property, eq(listing.propertyId, property.id))
      .where(buildListingWhereClause(userId, input))
      .orderBy(desc(listing.updatedAt))
      .limit(limit);

    return rows.map((row) => ({ ...row.listing, property: row.property }));
  }),

  getById: protectedProcedure.input(listingIdSchema).query(async ({ ctx, input }) => {
    const userId = requireUserId(ctx.userId);

    const [row] = await ctx.db
      .select({
        listing,
        property,
      })
      .from(listing)
      .leftJoin(property, eq(listing.propertyId, property.id))
      .where(and(eq(listing.id, input.id), eq(listing.userId, userId)))
      .limit(1);

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
    }

    return { ...row.listing, property: row.property };
  }),

  update: protectedProcedure.input(listingUpdateSchema).mutation(async ({ ctx, input }) => {
    const userId = requireUserId(ctx.userId);

    const { id, ...patch } = input;

    const [existing] = await ctx.db
      .select({ id: listing.id })
      .from(listing)
      .where(and(eq(listing.id, id), eq(listing.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
    }

    const updatePayload: Partial<typeof listing.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (patch.title !== undefined) {
      updatePayload.title = patch.title;
    }
    if (patch.monthlyRentYen !== undefined) {
      updatePayload.monthlyRentYen = patch.monthlyRentYen;
    }
    if (patch.addressText !== undefined) {
      updatePayload.addressText = patch.addressText;
    }
    if (patch.sourceUrl !== undefined) {
      updatePayload.sourceUrl = patch.sourceUrl;
    }
    if (patch.reikinMonths !== undefined) {
      updatePayload.reikinMonths = patch.reikinMonths.toString();
    }
    if (patch.securityDepositMonths !== undefined) {
      updatePayload.securityDepositMonths = patch.securityDepositMonths.toString();
    }
    if (patch.squareM !== undefined) {
      updatePayload.squareM = patch.squareM.toString();
    }
    if (patch.closestStation !== undefined) {
      updatePayload.closestStation = patch.closestStation;
    }
    if (patch.walkingTimeMin !== undefined) {
      updatePayload.walkingTimeMin = patch.walkingTimeMin;
    }
    if (patch.availability !== undefined) {
      updatePayload.availability = patch.availability;
    }
    if (patch.latitude !== undefined) {
      updatePayload.latitude = patch.latitude;
    }
    if (patch.longitude !== undefined) {
      updatePayload.longitude = patch.longitude;
    }
    if (patch.geocodeStatus !== undefined) {
      updatePayload.geocodeStatus = patch.geocodeStatus;
    }

    if (
      patch.latitude !== undefined &&
      patch.longitude !== undefined &&
      patch.geocodeStatus === undefined
    ) {
      updatePayload.geocodeStatus = "manual";
    }

    const [row] = await ctx.db
      .update(listing)
      .set(updatePayload)
      .where(and(eq(listing.id, id), eq(listing.userId, userId)))
      .returning();

    if (!row) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update listing" });
    }

    const shouldPatchProperty =
      patch.prefecture !== undefined ||
      patch.municipality !== undefined ||
      patch.town !== undefined ||
      patch.district !== undefined ||
      patch.block !== undefined ||
      patch.houseNumber !== undefined ||
      patch.propertyType !== undefined ||
      patch.interest !== undefined ||
      patch.pinExact !== undefined ||
      patch.latitude !== undefined ||
      patch.longitude !== undefined;

    if (shouldPatchProperty) {
      const propertyPatch: Partial<typeof property.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (patch.prefecture !== undefined) propertyPatch.prefecture = patch.prefecture;
      if (patch.municipality !== undefined) propertyPatch.municipality = patch.municipality;
      if (patch.town !== undefined) propertyPatch.town = patch.town;
      if (patch.district !== undefined) propertyPatch.district = patch.district;
      if (patch.block !== undefined) propertyPatch.block = patch.block;
      if (patch.houseNumber !== undefined) propertyPatch.houseNumber = patch.houseNumber;
      if (patch.propertyType !== undefined) propertyPatch.propertyType = patch.propertyType;
      if (patch.interest !== undefined) propertyPatch.interest = patch.interest;
      if (patch.pinExact !== undefined) propertyPatch.pinExact = patch.pinExact ? 1 : 0;
      if (patch.latitude !== undefined) propertyPatch.latitude = patch.latitude;
      if (patch.longitude !== undefined) propertyPatch.longitude = patch.longitude;

      if (row.propertyId) {
        await ctx.db
          .update(property)
          .set(propertyPatch)
          .where(and(eq(property.id, row.propertyId), eq(property.userId, userId)));
      } else {
        const [createdProperty] = await ctx.db
          .insert(property)
          .values({
            userId,
            ...propertyPatch,
          })
          .returning({ id: property.id });
        if (createdProperty?.id) {
          await ctx.db
            .update(listing)
            .set({ propertyId: createdProperty.id, updatedAt: new Date() })
            .where(and(eq(listing.id, id), eq(listing.userId, userId)));
        }
      }
    }

    return row;
  }),

  delete: protectedProcedure.input(listingIdSchema).mutation(async ({ ctx, input }) => {
    const userId = requireUserId(ctx.userId);

    const deleted = await ctx.db
      .delete(listing)
      .where(and(eq(listing.id, input.id), eq(listing.userId, userId)))
      .returning({ id: listing.id });

    if (deleted.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
    }

    return { ok: true as const };
  }),
});
