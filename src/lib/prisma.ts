import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma() {
  const url = process.env.DATABASE_URL!;
  const sql = neon(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeon(sql as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
