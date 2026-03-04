/**
 * Prisma Client Singleton
 *
 * Uses Prisma 7 with the @prisma/adapter-pg driver adapter for PostgreSQL.
 * Prevents multiple Prisma Client instances during Next.js hot-reloading in
 * development. In production, a single instance is created and reused.
 *
 * IMPORTANT: The client is lazily initialized to avoid throwing during
 * `next build` when DATABASE_URL is not available. The first actual
 * database call will trigger initialization.
 *
 * Usage:
 *   import { db } from "@/lib/db";
 *   const recalls = await db.recallEvent.findMany();
 */

import { PrismaClient } from "@/generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Lazily-initialized Prisma client singleton.
 *
 * Uses a getter so the client is only created on first access (i.e., when
 * an actual database query runs), not at module import time. This prevents
 * build failures when DATABASE_URL is not yet available (e.g., during
 * `next build` on Vercel before runtime env vars are injected).
 */
function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Use a Proxy so `db` behaves as a PrismaClient, but defers creation until
// a property is actually accessed at runtime.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getDb();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
