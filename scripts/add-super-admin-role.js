/**
 * Migration script to update user_role enum and add the SUPER_ADMIN role
 */
const { pool } = require('../server/db');

async function updateRoleEnum() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration: Adding SUPER_ADMIN to user_role enum');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if SUPER_ADMIN already exists in the enum
    const checkEnum = await client.query(`
      SELECT e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role'
    `);
    
    const enumValues = checkEnum.rows.map(row => row.enumlabel);
    if (enumValues.includes('SUPER_ADMIN')) {
      console.log('SUPER_ADMIN already exists in user_role enum. No changes needed.');
      await client.query('COMMIT');
      return;
    }
    
    // Add SUPER_ADMIN to the enum
    await client.query(`
      ALTER TYPE "user_role" ADD VALUE 'SUPER_ADMIN';
    `);
    
    console.log('Successfully added SUPER_ADMIN to user_role enum');
    
    // Commit the transaction
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
updateRoleEnum()
  .then(() => {
    console.log('Migration completed successfully');
    pool.end();
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    pool.end();
    process.exit(1);
  });
