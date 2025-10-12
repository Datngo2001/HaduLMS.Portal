import { DefaultAzureCredential } from '@azure/identity';

export interface DatabaseConfig {
  connectionString: string;
  isAzure: boolean;
}

/**
 * Get database configuration based on environment
 */
export async function getDatabaseConfig(): Promise<DatabaseConfig> {
  const databaseUrl = process.env.DATABASE_URL;
  const azureSqlServer = process.env.AZURE_SQL_SERVER;
  const azureSqlDatabase = process.env.AZURE_SQL_DATABASE;

  // Check if we're using Azure SQL with Managed Identity
  if (azureSqlServer && azureSqlDatabase && process.env.NODE_ENV === 'production') {
    try {
      // Initialize Azure credential for Managed Identity
      const credential = new DefaultAzureCredential();
      
      // Get access token for Azure SQL Database
      const tokenResponse = await credential.getToken('https://database.windows.net/');
      
      if (tokenResponse?.token) {
        // Build connection string with access token
        const connectionString = `sqlserver://${azureSqlServer}:1433;database=${azureSqlDatabase};encrypt=true;trustServerCertificate=false;accessToken=${tokenResponse.token}`;
        
        return {
          connectionString,
          isAzure: true
        };
      }
    } catch (error) {
      console.error('Failed to get Azure access token:', error);
      throw new Error('Unable to authenticate with Azure SQL Database using Managed Identity');
    }
  }

  // Fallback to regular connection string (local development)
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return {
    connectionString: databaseUrl,
    isAzure: false
  };
}

/**
 * Get connection string for Prisma
 * This function can be used to dynamically set the DATABASE_URL for Prisma
 */
export async function getPrismaConnectionString(): Promise<string> {
  const config = await getDatabaseConfig();
  return config.connectionString;
}