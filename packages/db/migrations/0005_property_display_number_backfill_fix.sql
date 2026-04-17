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
