import type { property } from "@tokyo-listings/db";

type PropertyInsert = typeof property.$inferInsert;
type PropertySelect = typeof property.$inferSelect;

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && !(typeof value === "string" && value.trim() === "");
}

/**
 * Build a patch for linking to an existing property:
 * - never overwrite non-empty stored values
 * - allow filling missing address parts and interest
 * - never mutate propertyType on linked association
 */
export function buildLinkedPropertyFillPatch(
  existing: PropertySelect,
  incoming: {
    prefecture?: string;
    municipality?: string;
    town?: string;
    district?: number;
    block?: number;
    houseNumber?: number;
    interest?: "Top" | "Extremely" | "KindaPlus" | "KindaMinus" | "Nah";
  },
): Partial<PropertyInsert> {
  const patch: Partial<PropertyInsert> = {};

  if (!hasValue(existing.prefecture) && hasValue(incoming.prefecture)) patch.prefecture = incoming.prefecture;
  if (!hasValue(existing.municipality) && hasValue(incoming.municipality)) {
    patch.municipality = incoming.municipality;
  }
  if (!hasValue(existing.town) && hasValue(incoming.town)) patch.town = incoming.town;
  if (!hasValue(existing.district) && hasValue(incoming.district)) patch.district = incoming.district;
  if (!hasValue(existing.block) && hasValue(incoming.block)) patch.block = incoming.block;
  if (!hasValue(existing.houseNumber) && hasValue(incoming.houseNumber)) {
    patch.houseNumber = incoming.houseNumber;
  }
  if (!hasValue(existing.interest) && hasValue(incoming.interest)) patch.interest = incoming.interest;

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = new Date();
  }

  return patch;
}

