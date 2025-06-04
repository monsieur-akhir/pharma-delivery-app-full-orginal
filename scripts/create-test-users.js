/**
 * Script to create test users for each role in the system
 * This helps in testing and comparing different role capabilities
 */
const { pool } = require('../server/db');
const { drizzle } = require('drizzle-orm/node-postgres');
const { hash } = require('bcrypt');
const { eq } = require('drizzle-orm');

async function createTestUsers() {
  // Connect to the database
  const db = drizzle(pool);
  
  // Import schema definitions
  const { users, userRoleEnum } = require('../shared/src/schema');

  console.log('Creating test users for all roles...');

  // Define test users for each role
  const testUsers = [
    {
      role: 'SUPER_ADMIN',
      username: 'test_super_admin',
      email: 'test_super_admin@mediconnect.com',
      phone: '+33100000001',
      firstName: 'Test',
      lastName: 'SuperAdmin'
    },
    {
      role: 'ADMIN',
      username: 'test_admin',
      email: 'test_admin@mediconnect.com',
      phone: '+33100000002',
      firstName: 'Test',
      lastName: 'Admin'
    },
    {
      role: 'PHARMACIST',
      username: 'test_pharmacist',
      email: 'test_pharmacist@mediconnect.com',
      phone: '+33100000003',
      firstName: 'Test',
      lastName: 'Pharmacist'
    },
    {
      role: 'PHARMACY_STAFF',
      username: 'test_staff',
      email: 'test_staff@mediconnect.com',
      phone: '+33100000004',
      firstName: 'Test',
      lastName: 'Staff'
    },
    {
      role: 'DELIVERY_PERSON',
      username: 'test_delivery',
      email: 'test_delivery@mediconnect.com',
      phone: '+33100000005',
      firstName: 'Test',
      lastName: 'Delivery'
    },
    {
      role: 'CUSTOMER',
      username: 'test_customer',
      email: 'test_customer@mediconnect.com',
      phone: '+33100000006',
      firstName: 'Test',
      lastName: 'Customer'
    }
  ];

  // Generate the standard password hash for all test users
  const saltRounds = 10;
  const password = 'TestUser@123';
  const passwordHash = await hash(password, saltRounds);

  console.log('Creating test users...');
  
  // Create each test user if they don't already exist
  for (const testUser of testUsers) {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, testUser.username));
    
    if (existingUser.length > 0) {
      console.log(`User ${testUser.username} already exists.`);
      continue;
    }
    
    // Create new test user
    await db.insert(users).values({
      username: testUser.username,
      email: testUser.email,
      phone: testUser.phone,
      role: testUser.role,
      password_hash: passwordHash,
      first_name: testUser.firstName,
      last_name: testUser.lastName,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    console.log(`Created test user: ${testUser.username} (${testUser.role})`);
  }
  
  console.log('\nTest users created successfully!');
  console.log('--------------------------------------');
  console.log('Standard password for all test users: ' + password);
  console.log('--------------------------------------');
  console.log('Available test users:');
  
  testUsers.forEach(user => {
    console.log(`- ${user.username} (${user.role}) - ${user.email}`);
  });
  
  console.log('--------------------------------------');
  console.log('ATTENTION: These are test accounts. Do not use in production.');

  // Close the database connection
  await pool.end();
}

// Execute the script
createTestUsers().catch(error => {
  console.error('Error creating test users:', error);
  process.exit(1);
});
