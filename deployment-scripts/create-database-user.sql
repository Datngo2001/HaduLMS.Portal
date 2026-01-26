PRINT 'Createing App User';
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'hadu_lms_app')
BEGIN
    CREATE USER hadu_lms_app FOR LOGIN hadu_lms_app;
    PRINT 'User created successfully';
END
ELSE
BEGIN
    PRINT 'User already exists';
END
GO

-- Grant permissions
ALTER ROLE db_datareader ADD MEMBER hadu_lms_app;
ALTER ROLE db_datawriter ADD MEMBER hadu_lms_app;
ALTER ROLE db_ddladmin ADD MEMBER hadu_lms_app; -- For schema changes (Prisma migrations)
GO

PRINT 'Permissions granted successfully';
GO

PRINT 'Createing Migration User';
GO

-- Create Migration User
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'hadu_lms_migration')
BEGIN
    CREATE USER hadu_lms_migration FOR LOGIN hadu_lms_migration;
    PRINT '✓ Migration user created successfully';
END
ELSE
BEGIN
    PRINT '⚠ Migration user already exists';
END
GO

PRINT '';
PRINT 'Granting elevated permissions for database migrations...';
GO

-- Data Access Permissions
ALTER ROLE db_datareader ADD MEMBER hadu_lms_migration;
ALTER ROLE db_datawriter ADD MEMBER hadu_lms_migration;
PRINT '✓ Granted data read/write permissions';
GO

-- Schema Modification Permissions (Required for Migrations)
ALTER ROLE db_ddladmin ADD MEMBER hadu_lms_migration;
PRINT '✓ Granted DDL (schema change) permissions';
GO

-- Owner Permissions (Full control for migrations)
ALTER ROLE db_owner ADD MEMBER hadu_lms_migration;
PRINT '✓ Granted database owner permissions';
GO

-- Execute Permissions
GRANT EXECUTE TO hadu_lms_migration;
PRINT '✓ Granted execute permissions';
GO

-- View Definition (For Schema Introspection)
GRANT VIEW DEFINITION TO hadu_lms_migration;
PRINT '✓ Granted view definition permissions';
GO

-- Alter Any Schema Permission
GRANT ALTER ANY SCHEMA TO hadu_lms_migration;
PRINT '✓ Granted alter any schema permissions';
GO
