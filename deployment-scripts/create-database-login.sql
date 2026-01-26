IF NOT EXISTS (SELECT name FROM sys.sql_logins WHERE name = 'hadu_lms_app')
BEGIN
    CREATE LOGIN hadu_lms_app 
    WITH PASSWORD = '',;
    PRINT 'Login created successfully';
END
ELSE
BEGIN
    PRINT 'Login already exists';
END
GO

IF NOT EXISTS (SELECT name FROM sys.sql_logins WHERE name = 'hadu_lms_migration')
BEGIN
    CREATE LOGIN hadu_lms_migration 
    WITH PASSWORD = '';
    PRINT '✓ Migration login created successfully';
END
ELSE
BEGIN
    PRINT '⚠ Migration login already exists';
END
GO