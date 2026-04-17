WITH latest_listing AS (
  SELECT DISTINCT ON ("propertyId")
    "propertyId",
    translate(COALESCE("addressText", ''), '０１２３４５６７８９', '0123456789') AS addr
  FROM listing
  WHERE "propertyId" IS NOT NULL
  ORDER BY "propertyId", "updatedAt" DESC
),
parsed AS (
  SELECT
    p.id AS property_id,
    NULLIF((regexp_match(ll.addr, '([0-9]+)丁目'))[1], '')::integer AS district_num,
    NULLIF((regexp_match(ll.addr, '([0-9]+)\s*[-－ー‐]\s*([0-9]+)'))[1], '')::integer AS block_from_dash,
    NULLIF((regexp_match(ll.addr, '([0-9]+)\s*[-－ー‐]\s*([0-9]+)'))[2], '')::integer AS house_from_dash,
    NULLIF((regexp_match(ll.addr, '([0-9]+)番'))[1], '')::integer AS block_num,
    NULLIF((regexp_match(ll.addr, '([0-9]+)号'))[1], '')::integer AS house_num
  FROM property p
  JOIN latest_listing ll ON ll."propertyId" = p.id
)
UPDATE property p
SET
  "district" = COALESCE(p."district", parsed.district_num),
  "block" = COALESCE(p."block", parsed.block_from_dash, parsed.block_num),
  "houseNumber" = COALESCE(p."houseNumber", parsed.house_from_dash, parsed.house_num)
FROM parsed
WHERE p.id = parsed.property_id;
