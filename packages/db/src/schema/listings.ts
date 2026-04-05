import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const geocodeStatusEnum = pgEnum("geocode_status", ["pending", "ok", "failed", "manual"]);
export const listingAvailabilityEnum = pgEnum("listing_availability", ["募集中", "契約済"]);
export const propertyTypeEnum = pgEnum("property_type", ["一戸建て", "アパート"]);
export const interestLevelEnum = pgEnum("interest_level", [
  "Top",
  "Extremely",
  "KindaPlus",
  "KindaMinus",
  "Nah",
]);

export const property = pgTable(
  "property",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label"),
    prefecture: text("prefecture"),
    municipality: text("municipality"),
    town: text("town"),
    district: text("district"),
    block: text("block"),
    houseNumber: text("houseNumber"),
    propertyType: propertyTypeEnum("propertyType"),
    interest: interestLevelEnum("interest"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    pinExact: integer("pinExact").notNull().default(0),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
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
    sourcePortal: text("sourcePortal"),
    sourceFetchedAt: timestamp("sourceFetchedAt", {
      withTimezone: true,
      mode: "date",
    }),
    reikinMonths: numeric("reikinMonths", { precision: 5, scale: 2 }),
    securityDepositMonths: numeric("securityDepositMonths", { precision: 5, scale: 2 }),
    squareM: numeric("squareM", { precision: 7, scale: 2 }),
    closestStation: text("closestStation"),
    walkingTimeMin: integer("walkingTimeMin"),
    availability: listingAvailabilityEnum("availability"),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("listing_user_id_idx").on(t.userId),
    index("listing_user_rent_idx").on(t.userId, t.monthlyRentYen),
    uniqueIndex("listing_user_source_url_unique_idx")
      .on(t.userId, t.sourceUrl)
      .where(sql`${t.sourceUrl} is not null`),
  ],
);
