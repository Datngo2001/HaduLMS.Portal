# Azure SQL Database with Managed Identity Configuration

This guide explains how to configure your application to connect to Azure SQL Database using Managed Identity.

## Environment Variables

### Local Development

For local development, use the standard connection string:

```bash
DATABASE_URL="sqlserver://localhost;database=hadu_lms_local;user=sa;password=1234;encrypt=true;trustServerCertificate=true;integratedSecurity=false"
```

### Azure Production

For Azure deployment with Managed Identity, set these variables:

```bash
NODE_ENV=production
AZURE_SQL_SERVER="your-server-name.database.windows.net"
AZURE_SQL_DATABASE="your-database-name"
```

## Azure Setup Requirements

### 1. Enable Managed Identity on your Azure service

For **Azure App Service**:

```bash
az webapp identity assign --name <app-name> --resource-group <resource-group>
```

For **Azure Container Apps**:

```bash
az containerapp identity assign --name <app-name> --resource-group <resource-group>
```

For **Azure Functions**:

```bash
az functionapp identity assign --name <app-name> --resource-group <resource-group>
```

### 2. Grant SQL Database Access

Get the Managed Identity Object ID:

```bash
az webapp identity show --name <app-name> --resource-group <resource-group> --query principalId --output tsv
```

Connect to your Azure SQL Database and run:

```sql
-- Create a user for the managed identity
CREATE USER [<user-assigned-indetity-name>] FROM EXTERNAL PROVIDER;

-- Grant appropriate permissions
ALTER ROLE db_datareader ADD MEMBER [<user-assigned-indetity-name>];
ALTER ROLE db_datawriter ADD MEMBER [<user-assigned-indetity-name>];
ALTER ROLE db_ddladmin ADD MEMBER [<user-assigned-indetity-name>];
```

### 3. Connection String Format

The application will automatically construct the connection string:

```
sqlserver://<server>.database.windows.net:1433;database=<database>;encrypt=true;trustServerCertificate=false;accessToken=<managed-identity-token>
```

## How It Works

1. The application detects if it's running in Azure production environment
2. Uses `DefaultAzureCredential` to get an access token from Managed Identity
3. Constructs the connection string with the access token
4. Initializes Prisma with the dynamic connection string

## Troubleshooting

### Token Refresh

The access token has a limited lifetime. The application will automatically refresh tokens as needed.

### Local Development

When running locally, the application falls back to the standard `DATABASE_URL` connection string.

### Debugging

Enable debug logging by setting:

```bash
AZURE_LOG_LEVEL=verbose
```

## Security Benefits

- No connection strings with passwords stored in environment variables
- Tokens are automatically rotated
- Fine-grained access control through Azure RBAC
- Audit trail of database access through Azure monitoring
