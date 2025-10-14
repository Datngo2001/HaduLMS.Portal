// Node.js script to generate bcrypt hash for admin password
// Run this script to generate a secure password hash before using the SQL script
// 
// Usage:
// 1. Install bcryptjs: npm install bcryptjs
// 2. Replace 'YourSecurePassword' with your desired admin password
// 3. Run: node ./tools/admin-user-setup/generate_admin_password.js
// 4. Copy the generated hash to the SQL script

const bcrypt = require('bcryptjs');

// CHANGE THIS PASSWORD TO YOUR DESIRED ADMIN PASSWORD
const adminPassword = 'YourSecurePassword';

const saltRounds = 10;

async function generatePasswordHash() {
    try {
        const hash = await bcrypt.hash(adminPassword, saltRounds);
        
        console.log('='.repeat(60));
        console.log('ADMIN PASSWORD HASH GENERATOR');
        console.log('='.repeat(60));
        console.log('Password:', adminPassword);
        console.log('Hash:', hash);
        console.log('='.repeat(60));
        console.log('');
        console.log('INSTRUCTIONS:');
        console.log('1. Copy the hash above');
        console.log('2. Replace the @AdminPasswordHash value in create_admin_user.sql');
        console.log('3. Update the password comment in the SQL script');
        console.log('4. Run the SQL script in your production database');
        console.log('');
        console.log('SECURITY NOTE:');
        console.log('- Delete this file after generating the hash');
        console.log('- Never commit passwords to version control');
        console.log('- Change the default password immediately after first login');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('Error generating password hash:', error);
    }
}

generatePasswordHash();