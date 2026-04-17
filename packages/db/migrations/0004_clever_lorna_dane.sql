CREATE SEQUENCE IF NOT EXISTS "property_display_number_seq";
--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "displayNumber" integer;
--> statement-breakpoint
ALTER TABLE "property" ALTER COLUMN "displayNumber" SET DEFAULT nextval('property_display_number_seq');
--> statement-breakpoint
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS rn
  FROM "property"
)
UPDATE "property" p
SET "displayNumber" = numbered.rn
FROM numbered
WHERE p.id = numbered.id;
--> statement-breakpoint
SELECT setval(
  'property_display_number_seq',
  COALESCE((SELECT MAX("displayNumber") FROM "property"), 1),
  (SELECT COUNT(*) > 0 FROM "property")
);
--> statement-breakpoint
ALTER TABLE "property" ALTER COLUMN "displayNumber" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "property_display_number_unique_idx" ON "property" USING btree ("displayNumber");