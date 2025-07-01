const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '../.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function checkUsers() {
  try {
    console.log('Checking your user in database...');
    const users = await sql`SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 5`;
    console.log('Recent users:');
    users.forEach(user => {
      console.log(`- ${user.email}: ${user.role} (ID: ${user.id})`);
    });
    
    console.log('\nLooking for your specific user...');
    // You can add your email here to check specifically
    const yourUsers = await sql`SELECT id, email, name, role, created_at FROM users WHERE email LIKE '%@%' ORDER BY created_at DESC`;
    console.log('All users:');
    yourUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.role} (ID: ${user.id})`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers(); 