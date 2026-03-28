import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

export const geocodeStatusEnum = pgEnum("geocode_status", [
  "pending",
  "ok",
  "failed",
  "manual",
]);

export const property = pgTable(
  "property",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label"),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("property_user_id_idx").on(t.userId)],
);

export const listing = pgTable(
  "listing",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    propertyId: uuid("propertyId").references(() => property.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    monthlyRentYen: integer("monthlyRentYen").notNull(),
    addressText: text("addressText").notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    geocodeStatus: geocodeStatusEnum("geocodeStatus").notNull().default("pending"),
    stationDistanceM: integer("stationDistanceM"),
    interestTag: text("interestTag"),
    sourceUrl: text("sourceUrl"),
    sourceFetchedAt: timestamp("sourceFetchedAt", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("listing_user_id_idx").on(t.userId),
    index("listing_user_rent_idx").on(t.userId, t.monthlyRentYen),
  ],
);
