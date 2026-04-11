import type { findSimilarPropertiesInputSchema } from "@tokyo-listings/validators/listing";
import type { z } from "zod";

export type SimilarPropertiesDraft = z.infer<typeof findSimilarPropertiesInputSchema>;

/** Mirrors `hasMinimumAddressForMatch` in `apps/api/src/lib/property-matching.ts` for query `enabled`. */
export function similarDraftIsQueryable(d: SimilarPropertiesDraft): boolean {
  const compact = [d.prefecture, d.municipality, d.town, d.district, d.block, d.houseNumber]
    .map((x) => (x ?? "").trim())
    .join("");
  return compact.length >= 2;
}
