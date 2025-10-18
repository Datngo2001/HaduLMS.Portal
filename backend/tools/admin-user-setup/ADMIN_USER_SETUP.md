# Admin User Creation for HaduLMS Portal

This directory contains scripts to create an admin user for the HaduLMS Portal application in production.

## Files

1. **`create_admin_user.sql`** - SQL Server script to create the admin user
2. **`generate_admin_password.js`** - Node.js script to generate secure bcrypt password hash
3. **`ADMIN_USER_SETUP.md`** - This instruction file

## Setup Instructions

### Step 1: Generate Secure Password Hash

1. **Install bcryptjs** (if not already installed):
   ```bash
   npm install bcryptjs
   ```

2. **Edit the password generator script**:
   - Open `generate_admin_password.js`
   - Replace `'YourSecurePassword'` with your desired admin password
   - Use a strong password (minimum 12 characters, mix of letters, numbers, symbols)

3. **Generate the hash**:
   ```bash
   node generate_admin_password.js
   ```

4. **Copy the generated hash** from the output

### Step 2: Update SQL Script

1. **Open `create_admin_user.sql`**

2. **Update the following variables**:
   - `@AdminPasswordHash`: Replace with the hash generated in Step 1
   - `@AdminEmail`: Change if you want a different admin email
   - `@AdminFirstName` and `@AdminLastName`: Customize as needed
   - Database name: Replace `[YourDatabaseName]` with your actual database name

### Step 3: Execute in Production

1. **Connect to your SQL Server production database**

2. **Run the SQL script**:
   - Execute `create_admin_user.sql` in SQL Server Management Studio or Azure Data Studio
   - The script will check if an admin user already exists
   - If not found, it will create a new admin user
   - If found, it will display the existing user info

### Step 4: Verify and Clean Up

1. **Test the admin login** using the credentials you set

2. **Delete the password generator files**:
   ```bash
   rm generate_admin_password.js
   rm ADMIN_USER_SETUP.md
   ```

3. **Keep `create_admin_user.sql`** for reference (but remove any password comments)

## Default Configuration

- **Email**: `admin@hadu.edu`
- **Role**: `ADMIN`
- **Password**: Set by you in the generator script

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS**:

1. **Change the password immediately** after first login
2. **Never commit passwords** to version control
3. **Delete the generator script** after use
4. **Use a strong, unique password** for the admin account
5. **Enable 2FA** if supported by your application
6. **Regularly rotate** the admin password

## Troubleshooting

### Common Issues

1. **User already exists**:
   - The script will detect existing users and not create duplicates
   - Uncomment the UPDATE section in the SQL script to reset password if needed

2. **Database connection issues**:
   - Verify your database connection string
   - Ensure you have appropriate permissions to INSERT into the users table

3. **Password hash issues**:
   - Ensure you're using bcryptjs version compatible with your backend
   - Verify the salt rounds match your application (default: 10)

### Database Schema Verification

The script expects the following table structure:
```sql
[dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    [avatar] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL
)
```

## Support

If you encounter issues:
1. Check the database connection and permissions
2. Verify the table schema matches expectations
3. Ensure bcrypt compatibility between generator and application
4. Review application logs for authentication errors