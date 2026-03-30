CREATE TYPE "public"."interest_level" AS ENUM('Top', 'Extremely', 'KindaPlus', 'KindaMinus', 'Nah');--> statement-breakpoint
CREATE TYPE "public"."listing_availability" AS ENUM('募集中', '契約済');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('一戸建て', 'アパート');--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "reikinMonths" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "securityDepositMonths" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "squareM" numeric(7, 2);--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "closestStation" text;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "walkingTimeMin" integer;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "availability" "listing_availability";--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "prefecture" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "municipality" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "town" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "district" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "block" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "houseNumber" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "propertyType" "property_type";--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "interest" "interest_level";--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "pinExact" integer DEFAULT 0 NOT NULL;