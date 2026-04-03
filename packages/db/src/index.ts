import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index";

export type AppDatabase = PostgresJsDatabase<typeof schema>;

export * from "./schema/index";

export { schema };

export type { InferInsertModel, InferSelectModel } from "drizzle-orm";
