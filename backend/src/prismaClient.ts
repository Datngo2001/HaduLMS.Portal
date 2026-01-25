import { PrismaMssql } from "@prisma/adapter-mssql";
import dotenv from "dotenv";
import { PrismaClient } from "./prisma/generated/client";

dotenv.config();

declare global {
  // Preserve PrismaClient during dev hot-reloads
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaMssql(connectionString);

const createPrismaClient = () => new PrismaClient({ adapter });

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
