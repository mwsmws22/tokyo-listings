import { listing } from "@tokyo-listings/db";
import {
  listingCreateSchema,
  listingIdSchema,
  listingListSchema,
  listingUpdateSchema,
} from "@tokyo-listings/validators/listing";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { geocodeAddress } from "../../lib/geocoding";
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

    const [row] = await ctx.db
      .insert(listing)
      .values({
        userId,
        title: input.title,
        monthlyRentYen: input.monthlyRentYen,
        addressText: input.addressText,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        geocodeStatus: (coords ? "ok" : hasKey ? "failed" : "pending") as
          | "pending"
          | "ok"
          | "failed",
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

    return ctx.db
      .select()
      .from(listing)
      .where(eq(listing.userId, userId))
      .orderBy(desc(listing.updatedAt))
      .limit(limit);
  }),

  getById: protectedProcedure.input(listingIdSchema).query(async ({ ctx, input }) => {
    const userId = requireUserId(ctx.userId);

    const [row] = await ctx.db
      .select()
      .from(listing)
      .where(and(eq(listing.id, input.id), eq(listing.userId, userId)))
      .limit(1);

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
    }

    return row;
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
