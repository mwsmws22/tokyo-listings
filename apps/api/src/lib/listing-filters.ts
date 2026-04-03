import { listing, property } from "@tokyo-listings/db";
import { type SQL, and, eq, ilike } from "drizzle-orm";

export type ListingListInput = {
  limit?: number;
  propertyType?: "一戸建て" | "アパート";
  availability?: "募集中" | "契約済";
  interest?: "Top" | "Extremely" | "KindaPlus" | "KindaMinus" | "Nah";
  prefecture?: string;
  municipality?: string;
  town?: string;
  district?: string;
  block?: string;
};

function hasText(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

type PropertyTextColumn =
  | typeof property.prefecture
  | typeof property.municipality
  | typeof property.town
  | typeof property.district
  | typeof property.block;

function contains(column: PropertyTextColumn, value: string | undefined): SQL | undefined {
  if (!hasText(value)) {
    return undefined;
  }
  return ilike(column, `%${value.trim()}%`);
}

export function buildListingWhereClause(userId: string, input: ListingListInput): SQL {
  const filters: (SQL | undefined)[] = [eq(listing.userId, userId)];

  if (input.availability) {
    filters.push(eq(listing.availability, input.availability));
  }
  if (input.propertyType) {
    filters.push(eq(property.propertyType, input.propertyType));
  }
  if (input.interest) {
    filters.push(eq(property.interest, input.interest));
  }

  filters.push(contains(property.prefecture, input.prefecture));
  filters.push(contains(property.municipality, input.municipality));
  filters.push(contains(property.town, input.town));
  filters.push(contains(property.district, input.district));
  filters.push(contains(property.block, input.block));

  return and(...filters.filter(Boolean)) as SQL;
}
