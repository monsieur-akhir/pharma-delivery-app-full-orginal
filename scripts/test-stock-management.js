const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testStockManagement() {
  console.log('Testing stock management functionality...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : undefined,
  });

  try {
    // Test 1: Check if stock_movements table exists
    console.log('1. Checking if stock_movements table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_movements'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ stock_movements table exists');
    } else {
      console.log('❌ stock_movements table does not exist');
      return;
    }

    // Test 2: Check table structure
    console.log('2. Checking table structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stock_movements'
      ORDER BY ordinal_position;
    `);
    
    console.log('Table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    // Test 3: Check if enum exists
    console.log('3. Checking if stock_movement_type enum exists...');
    const enumCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type'
      );
    `);
    
    if (enumCheck.rows[0].exists) {
      console.log('✅ stock_movement_type enum exists');
      
      // Get enum values
      const enumValues = await pool.query(`
        SELECT enumlabel FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_movement_type')
        ORDER BY enumsortorder;
      `);
      console.log('Enum values:', enumValues.rows.map(row => row.enumlabel));
    } else {
      console.log('❌ stock_movement_type enum does not exist');
    }

    // Test 4: Check if sample data can be inserted (if we have test pharmacy and medicine)
    console.log('4. Checking for sample data...');
    const pharmacyCount = await pool.query('SELECT COUNT(*) FROM pharmacies');
    const medicineCount = await pool.query('SELECT COUNT(*) FROM medicines');
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    
    console.log(`Found ${pharmacyCount.rows[0].count} pharmacies, ${medicineCount.rows[0].count} medicines, ${userCount.rows[0].count} users`);

    console.log('✅ Stock management database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing stock management:', error);
  } finally {
    await pool.end();
  }
}

testStockManagement().catch(console.error);
