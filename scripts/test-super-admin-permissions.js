/**
 * Script to test if a SUPER_ADMIN user has access to all permissions
 * This script provides a verification of the SUPER_ADMIN role implementation
 */
const { pool } = require('../server/db');
const { drizzle } = require('drizzle-orm/node-postgres');

async function testSuperAdminPermissions() {
  // Connect to the database
  const db = drizzle(pool);

  // Import schema definitions
  const { permissions, users } = require('../shared/src/schema');

  console.log('Testing SUPER_ADMIN permissions...');

  try {
    // Find a SUPER_ADMIN user
    const superAdminUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role
      })
      .from(users)
      .where(eq(users.role, 'SUPER_ADMIN'));

    if (superAdminUsers.length === 0) {
      console.log('No SUPER_ADMIN users found. Please run create-super-admin.js first.');
      return;
    }

    const superAdminUser = superAdminUsers[0];
    console.log(`Found SUPER_ADMIN user: ${superAdminUser.username} (${superAdminUser.email})`);

    // Get all possible permissions in the system
    const allPermissions = await db.select().from(permissions);
    console.log(`Found ${allPermissions.length} permissions in the system.`);

    // Get the permissions service module to test permission checks
    const { PermissionsService } = require('../backend/src/admin/permissions/permissions.service');
    const { DatabaseService } = require('../backend/src/database/database.service');
    
    // Create a database service instance
    const databaseService = {
      db: db
    };
    
    // Create a permissions service instance with the database service
    const permissionsService = new PermissionsService(databaseService);

    console.log('Testing if SUPER_ADMIN has all permissions:');
    
    // Test each permission
    let allPermissionsGranted = true;
    for (const permission of allPermissions) {
      const hasPermission = await permissionsService.hasPermission(superAdminUser.id, permission.name);
      
      if (!hasPermission) {
        allPermissionsGranted = false;
        console.log(`❌ Failed: SUPER_ADMIN does not have permission: ${permission.name}`);
      } else {
        console.log(`✅ Passed: SUPER_ADMIN has permission: ${permission.name}`);
      }
    }
    
    if (allPermissionsGranted) {
      console.log('SUCCESS: SUPER_ADMIN role has all permissions as expected.');
    } else {
      console.log('WARNING: SUPER_ADMIN is missing some permissions!');
    }

  } catch (error) {
    console.error('Error testing SUPER_ADMIN permissions:', error);
  }

  // Close the database connection
  await pool.end();
}

// Import the necessary packages
const { eq } = require('drizzle-orm');

// Run the script
testSuperAdminPermissions().catch(error => {
  console.error('Error running test script:', error);
  process.exit(1);
});
