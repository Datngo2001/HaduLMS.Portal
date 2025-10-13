export interface DatabaseConfig {
  connectionString: string;
}

/**
 * Get database configuration from environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  return {
    connectionString: databaseUrl,
  };
}

/**
 * Get connection string for Prisma
 * This function can be used to dynamically set the DATABASE_URL for Prisma
 */
export function getPrismaConnectionString(): string {
  const config = getDatabaseConfig();
  return config.connectionString;
}
