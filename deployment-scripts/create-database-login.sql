IF NOT EXISTS (SELECT name FROM sys.sql_logins WHERE name = 'hadu_lms_app')
BEGIN
    CREATE LOGIN hadu_lms_app 
    WITH PASSWORD = 'StrongP@ssw0rd!',;
    PRINT 'Login created successfully';
END
ELSE
BEGIN
    PRINT 'Login already exists';
END
GO
