import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Guard: don't crash at build time if DATABASE_URL isn't set yet
const getDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL environment variable is not set.");
    }
    // Return a placeholder during local build without a DB
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  }
  return process.env.DATABASE_URL;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: getDatabaseUrl() } },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
