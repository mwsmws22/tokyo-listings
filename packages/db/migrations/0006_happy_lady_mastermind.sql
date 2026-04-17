ALTER TABLE "property"
ALTER COLUMN "district" TYPE integer
USING NULLIF(
  regexp_replace(
    translate(COALESCE("district", ''), '０１２３４５６７８９', '0123456789'),
    '[^0-9]',
    '',
    'g'
  ),
  ''
)::integer;
--> statement-breakpoint
ALTER TABLE "property"
ALTER COLUMN "block" TYPE integer
USING NULLIF(
  regexp_replace(
    translate(COALESCE("block", ''), '０１２３４５６７８９', '0123456789'),
    '[^0-9]',
    '',
    'g'
  ),
  ''
)::integer;
--> statement-breakpoint
ALTER TABLE "property"
ALTER COLUMN "houseNumber" TYPE integer
USING (
  CASE
    WHEN NULLIF(COALESCE("houseNumber", ''), '') IS NULL THEN NULL
    ELSE (
      regexp_match(
        translate("houseNumber", '０１２３４５６７８９', '0123456789'),
        '([0-9]+)(?:[^0-9]*)$'
      )
    )[1]::integer
  END
);