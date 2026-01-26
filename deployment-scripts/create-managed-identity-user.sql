-- Connect to your database (not master) as Azure AD admin
CREATE USER [hadu-lms-test] FROM EXTERNAL PROVIDER;

-- Grant permissions for runtime
ALTER ROLE db_datareader ADD MEMBER [hadu-lms-test];
ALTER ROLE db_datawriter ADD MEMBER [hadu-lms-test];
GRANT EXECUTE TO [hadu-lms-test];

-- Grant permissions for migrations (if needed)
ALTER ROLE db_ddladmin ADD MEMBER [hadu-lms-test];
ALTER ROLE db_owner ADD MEMBER [hadu-lms-test];