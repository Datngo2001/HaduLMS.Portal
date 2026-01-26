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
