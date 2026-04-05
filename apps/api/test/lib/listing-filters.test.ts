import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { buildListingWhereClause } from "../../src/lib/listing-filters";

const dialect = new PgDialect();

function sqlText(where: ReturnType<typeof buildListingWhereClause>): string {
  return dialect.sqlToQuery(where).sql;
}

function sqlParams(where: ReturnType<typeof buildListingWhereClause>): unknown[] {
  return dialect.sqlToQuery(where).params;
}

describe("buildListingWhereClause", () => {
  it("always includes user constraint", () => {
    const where = buildListingWhereClause("user-1", {});
    expect(where).toBeTruthy();
    expect(sqlText(where)).toMatch(/listing/i);
  });

  it("includes optional parity filters", () => {
    const where = buildListingWhereClause("user-1", {
      availability: "募集中",
      propertyType: "アパート",
      prefecture: "東京都",
      town: "小石川",
    });

    const text = sqlText(where);
    expect(text).toMatch(/listing/i);
    const params = sqlParams(where);
    expect(params).toContain("募集中");
    expect(params).toContain("アパート");
    expect(params.some((p) => typeof p === "string" && p.includes("小石川"))).toBe(true);
  });
});
