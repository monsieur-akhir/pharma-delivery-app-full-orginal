const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  console.log('Updating pharmacies table...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create a PostgreSQL connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : undefined,
  });

  // Connect to the database
  try {
    console.log('Connected to database, altering pharmacies table...');
    
    try {
      // Create pharmacy_status enum if it doesn't exist
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE "pharmacy_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PENDING_INFO');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Add missing columns to the pharmacies table
      const alterQueries = [
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "license_number" TEXT UNIQUE;`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN NOT NULL DEFAULT FALSE;`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "rating" DECIMAL(3, 2) DEFAULT 0.00;`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "website" TEXT;`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "is_24_hours" BOOLEAN DEFAULT FALSE;`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "image_url" TEXT;`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "status" "pharmacy_status" DEFAULT 'PENDING';`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "additional_info_required" TEXT;`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "verified_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL;`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP;`,
        `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS "reorder_threshold" INTEGER DEFAULT 10;`
      ];

      for (const query of alterQueries) {
        await pool.query(query);
      }

      console.log('Pharmacies table updated successfully!');
    } catch (error) {
      console.error('Error updating pharmacies table:', error);
      throw error;
    }

    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error in update-pharmacies-table script:', err);
  process.exit(1);
});