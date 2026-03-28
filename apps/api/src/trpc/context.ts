import { auth } from "../lib/auth.ts";
import { db } from "../lib/db.ts";

type SessionPayload = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type TRPCContext = {
  db: typeof db;
  session: SessionPayload["session"] | null;
  user: SessionPayload["user"] | null;
  userId: string | null;
};

export async function createTRPCContext(opts: {
  req: Request;
}): Promise<TRPCContext> {
  const data = await auth.api.getSession({ headers: opts.req.headers });
  return {
    db,
    session: data?.session ?? null,
    user: data?.user ?? null,
    userId: data?.user?.id ?? null,
  };
}
