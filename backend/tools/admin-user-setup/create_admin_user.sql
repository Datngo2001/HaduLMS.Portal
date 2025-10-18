-- SQL Server script to create admin user for HaduLMS Portal
-- This script creates an admin user with secure password hashing
-- 
-- IMPORTANT: 
-- 1. Replace 'your_secure_password_here' with your desired admin password
-- 2. The password hash below is bcrypt hash for 'AdminPassword123!' 
-- 3. You should generate a new bcrypt hash for your actual password
--
-- To generate bcrypt hash, you can use online tools or Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('your_password', 10);
-- console.log(hash);

USE [YourDatabaseName] -- Replace with your actual database name
GO

DECLARE @AdminEmail NVARCHAR(1000) = 'admin@hadu.edu'
DECLARE @AdminFirstName NVARCHAR(1000) = 'System'
DECLARE @AdminLastName NVARCHAR(1000) = 'Administrator'
-- This is bcrypt hash for 'AdminPassword123!' - CHANGE THIS!
DECLARE @AdminPasswordHash NVARCHAR(1000) = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
DECLARE @AdminRole NVARCHAR(1000) = 'ADMIN'
DECLARE @CurrentDateTime DATETIME2 = GETUTCDATE()

-- Generate a CUID-like ID (simplified version)
DECLARE @AdminId NVARCHAR(1000) = 'admin_' + CAST(NEWID() AS NVARCHAR(36))

-- Check if admin user already exists
IF NOT EXISTS (SELECT 1 FROM [dbo].[users] WHERE [email] = @AdminEmail)
BEGIN
    -- Insert the admin user
    INSERT INTO [dbo].[users] (
        [id],
        [email],
        [firstName],
        [lastName],
        [password],
        [role],
        [avatar],
        [createdAt],
        [updatedAt]
    )
    VALUES (
        @AdminId,
        @AdminEmail,
        @AdminFirstName,
        @AdminLastName,
        @AdminPasswordHash,
        @AdminRole,
        NULL, -- no avatar
        @CurrentDateTime,
        @CurrentDateTime
    )

    PRINT 'Admin user created successfully!'
    PRINT 'Email: ' + @AdminEmail
    PRINT 'Password: AdminPassword123! (CHANGE THIS IMMEDIATELY!)'
    PRINT 'Role: ' + @AdminRole
END
ELSE
BEGIN
    PRINT 'Admin user with email ' + @AdminEmail + ' already exists!'
    
    -- Optionally update the existing admin user's password
    -- Uncomment the lines below if you want to reset the admin password
    /*
    UPDATE [dbo].[users] 
    SET 
        [password] = @AdminPasswordHash,
        [updatedAt] = @CurrentDateTime
    WHERE [email] = @AdminEmail
    
    PRINT 'Admin user password updated!'
    */
END

-- Verify the admin user was created/exists
SELECT 
    [id],
    [email],
    [firstName],
    [lastName],
    [role],
    [createdAt],
    [updatedAt]
FROM [dbo].[users] 
WHERE [email] = @AdminEmail

GO