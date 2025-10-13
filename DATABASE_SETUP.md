# Database Setup Guide - HaduLMS Portal

This guide provides step-by-step instructions for setting up the database for the HaduLMS Portal project.

## Prerequisites

- SQL Server (Local or Remote instance)
- SQL Server Management Studio (SSMS) or Azure Data Studio
- Administrative access to SQL Server

## Database Setup Steps

### Step 1: Create Database Login (Master Database)

First, connect to your SQL Server instance and execute the following command in the **master** database (check .docs\connect_to_master.png to connect):

```sql
-- Connect to master database
USE master;

-- Create login for HaduLMS application
CREATE LOGIN [hadu_lms_user] WITH PASSWORD = '123123123';
```

### Step 2: Create Target Database

Create the main database for the HaduLMS application:

```sql
-- Create the main database (adjust file paths as needed)
CREATE DATABASE [hadu_lms_test];
```

### Step 3: Create Database User and Grant Permissions

Switch to your target database and create a user for the login:

```sql
-- Switch to your target database
USE [hadu_lms_test];

-- Create a user in the database for the login
CREATE USER [hadu_lms_user] FOR LOGIN [hadu_lms_user];

-- Grant necessary permissions (adjust based on your needs)
-- Option 1: Grant db_owner role (full database access) - Use for development only
-- ALTER ROLE db_owner ADD MEMBER [hadu_lms_user];

-- Option 2: Grant specific permissions (more secure - recommended for production)
ALTER ROLE db_datareader ADD MEMBER [hadu_lms_user];
ALTER ROLE db_datawriter ADD MEMBER [hadu_lms_user];
GRANT EXECUTE TO [hadu_lms_user];

-- Additional permissions for schema modifications (needed for migrations)
GRANT CREATE TABLE TO [hadu_lms_user];
GRANT ALTER ON SCHEMA::dbo TO [hadu_lms_user];
```

### Step 4: Verify User Creation and Permissions

Run the following query to verify that the user was created successfully and has the correct permissions:

```sql
-- Verify the user was created and check permissions
SELECT
    p.name AS principal_name,
    p.type_desc AS principal_type,
    r.name AS role_name
FROM sys.database_principals p
LEFT JOIN sys.database_role_members rm ON p.principal_id = rm.member_principal_id
LEFT JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
WHERE p.name = 'hadu_lms_user';
```

### Step 5: Configure Connection String

Update your application's connection string to use the new database user.

#### For Prisma (DATABASE_URL in .env file):

```env
DATABASE_URL="sqlserver://your_server_name;database=hadu_lms_test;user=hadu_lms_user;password=123123123;trustServerCertificate=true;encrypt=true"
```

#### For Direct Connection (if needed):

```
Server=your_server_name;Database=hadu_lms_test;User Id=hadu_lms_user;Password=123123123;TrustServerCertificate=true;
```

**Note**: Create a `.env` file in your backend directory and add the DATABASE_URL if it doesn't exist already.

## Environment-Specific Setup

### Development Environment

- Use the more permissive permissions (Option 1) for easier development
- Consider using integrated security if working locally

### Production Environment

- Use the restrictive permissions (Option 2)
- Store connection strings in secure configuration
- Consider using Azure Key Vault or similar for password management
- Use strong, unique passwords

## Prisma Setup

After setting up the database, you'll need to configure Prisma:

1. **Update Prisma Schema**: Ensure your `prisma/schema.prisma` file has the correct database URL
2. **Run Migrations**: Execute `npm run db:migrate` in the backend directory
3. **Generate Prisma Client**: Execute `npm run db:generate` in the backend directory
4. **Seed Database** (optional): Execute `npm run db:seed` in the backend directory

## Security Considerations

1. **Password Security**:

   - Use strong passwords with a mix of uppercase, lowercase, numbers, and special characters
   - Change default passwords before production deployment

2. **Principle of Least Privilege**:

   - Grant only the minimum permissions required for the application to function
   - Avoid using `db_owner` role in production

3. **Connection Security**:

   - Use encrypted connections when possible
   - Store connection strings securely (environment variables, key vaults)

4. **Regular Maintenance**:
   - Regularly review and audit database permissions
   - Keep SQL Server updated with security patches

## Troubleshooting

### Common Issues

1. **Login Failed**: Ensure the login was created in the master database
2. **Permission Denied**: Verify the user has the necessary role memberships
3. **Connection Issues**: Check firewall settings and SQL Server configuration

### Useful Commands

```sql
-- Check if login exists
SELECT name FROM sys.server_principals WHERE name = 'hadu_lms_user';

-- Check database users
SELECT name FROM sys.database_principals WHERE name = 'hadu_lms_user';

-- Check role memberships
SELECT
    r.name AS role_name,
    m.name AS member_name
FROM sys.database_role_members rm
JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
WHERE m.name = 'hadu_lms_user';
```

## Next Steps

After completing the database setup:

1. Test the connection from your application
2. Run Prisma migrations to create the required tables
3. Optionally seed the database with initial data
4. Configure backup and maintenance plans for production environments

For any issues or questions, refer to the application documentation or contact the development team.
