const bcrypt = require('bcrypt');
const db = require('./config/database');

async function fixAdminPassword() {
  try {
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Generated hash:', hashedPassword);
    
    // Update admin password
    await db.query(
      'UPDATE users SET password = ? WHERE login_id = ?',
      [hashedPassword, 'ADMIN001']
    );
    
    console.log('Admin password updated successfully!');
    console.log('Login ID: ADMIN001');
    console.log('Password: Admin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAdminPassword();
