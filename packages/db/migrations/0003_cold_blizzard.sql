DO $$
DECLARE
  r RECORD;
  new_id uuid;
BEGIN
  FOR r IN
    SELECT id, "userId", latitude, longitude
    FROM listing
    WHERE "propertyId" IS NULL
  LOOP
    INSERT INTO property (id, "userId", latitude, longitude, "pinExact", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), r."userId", r.latitude, r.longitude, 0, now(), now())
    RETURNING id INTO new_id;
    UPDATE listing SET "propertyId" = new_id WHERE id = r.id;
  END LOOP;
END
$$;
--> statement-breakpoint
ALTER TABLE "listing" DROP CONSTRAINT "listing_propertyId_property_id_fk";
--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "propertyId" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_propertyId_property_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE restrict ON UPDATE no action;
