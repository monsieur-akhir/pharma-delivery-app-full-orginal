const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('../shared/schema');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
  console.log('Pushing schema to database...');
  
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
    const db = drizzle(pool, { schema });

    // Push the schema to the database
    console.log('Connected to database, applying schema...');
    
    // Since we're not using a migration, we'll manually create tables
    try {
      // Manually execute schema creation SQL for each table
      // Create user_role enum
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE "user_role" AS ENUM ('CUSTOMER', 'ADMIN', 'PHARMACY_STAFF', 'PHARMACIST', 'DELIVERY_PERSON');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create order_status enum
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE "order_status" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" SERIAL PRIMARY KEY,
          "username" TEXT NOT NULL UNIQUE,
          "email" TEXT UNIQUE,
          "phone" TEXT NOT NULL UNIQUE,
          "role" "user_role" NOT NULL DEFAULT 'CUSTOMER',
          "address" TEXT,
          "location" JSONB,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
          "profile_image" TEXT,
          "stripe_customer_id" TEXT,
          "stripe_subscription_id" TEXT
        );
      `);

      // Create pharmacies table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "pharmacies" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "address" TEXT NOT NULL,
          "location" JSONB NOT NULL,
          "phone" TEXT NOT NULL,
          "email" TEXT,
          "opening_hours" JSONB,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
          "logo_image" TEXT
        );
      `);

      // Create medicines table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "medicines" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "manufacturer" TEXT,
          "category" TEXT,
          "requires_prescription" BOOLEAN NOT NULL DEFAULT FALSE,
          "image_url" TEXT,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Create pharmacy_staff table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "pharmacy_staff" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "pharmacy_id" INTEGER NOT NULL REFERENCES "pharmacies"("id") ON DELETE CASCADE,
          "position" TEXT NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE("user_id", "pharmacy_id")
        );
      `);

      // Create pharmacy_medicines table (inventory)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "pharmacy_medicines" (
          "id" SERIAL PRIMARY KEY,
          "pharmacy_id" INTEGER NOT NULL REFERENCES "pharmacies"("id") ON DELETE CASCADE,
          "medicine_id" INTEGER NOT NULL REFERENCES "medicines"("id") ON DELETE CASCADE,
          "price" NUMERIC(10, 2) NOT NULL,
          "stock_quantity" INTEGER NOT NULL DEFAULT 0,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE("pharmacy_id", "medicine_id")
        );
      `);

      // Create orders table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "orders" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
          "pharmacy_id" INTEGER NOT NULL REFERENCES "pharmacies"("id"),
          "status" "order_status" NOT NULL DEFAULT 'PENDING',
          "total_amount" NUMERIC(10, 2) NOT NULL,
          "delivery_address" TEXT,
          "delivery_location" JSONB,
          "delivery_fee" NUMERIC(10, 2) DEFAULT 0,
          "delivery_notes" TEXT,
          "payment_method" TEXT,
          "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "delivery_person_id" INTEGER REFERENCES "users"("id"),
          "estimated_delivery_time" TIMESTAMP,
          "actual_delivery_time" TIMESTAMP
        );
      `);

      // Create order_items table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "order_items" (
          "id" SERIAL PRIMARY KEY,
          "order_id" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
          "medicine_id" INTEGER NOT NULL REFERENCES "medicines"("id"),
          "quantity" INTEGER NOT NULL,
          "unit_price" NUMERIC(10, 2) NOT NULL,
          "total_price" NUMERIC(10, 2) NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Create prescriptions table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "prescriptions" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
          "order_id" INTEGER REFERENCES "orders"("id"),
          "image_url" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "notes" TEXT,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "verified_by" INTEGER REFERENCES "users"("id"),
          "verified_at" TIMESTAMP,
          "ai_analysis" JSONB
        );
      `);

      // Create messages table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "messages" (
          "id" SERIAL PRIMARY KEY,
          "sender_id" INTEGER NOT NULL REFERENCES "users"("id"),
          "receiver_id" INTEGER NOT NULL REFERENCES "users"("id"),
          "order_id" INTEGER REFERENCES "orders"("id"),
          "content" TEXT NOT NULL,
          "read_at" TIMESTAMP,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Create reminders table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "reminders" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "medicine_id" INTEGER REFERENCES "medicines"("id"),
          "title" TEXT NOT NULL,
          "description" TEXT,
          "frequency" JSONB NOT NULL,
          "start_date" TIMESTAMP NOT NULL,
          "end_date" TIMESTAMP,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "active" BOOLEAN NOT NULL DEFAULT TRUE,
          "last_triggered_at" TIMESTAMP
        );
      `);

      // Create supplier_orders table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "supplier_orders" (
          "id" SERIAL PRIMARY KEY,
          "pharmacy_id" INTEGER NOT NULL REFERENCES "pharmacies"("id"),
          "supplier_name" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "total_amount" NUMERIC(10, 2) NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "expected_delivery_date" TIMESTAMP,
          "actual_delivery_date" TIMESTAMP,
          "created_by" INTEGER REFERENCES "users"("id")
        );
      `);

      // Create supplier_order_items table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "supplier_order_items" (
          "id" SERIAL PRIMARY KEY,
          "supplier_order_id" INTEGER NOT NULL REFERENCES "supplier_orders"("id") ON DELETE CASCADE,
          "medicine_id" INTEGER NOT NULL REFERENCES "medicines"("id"),
          "quantity" INTEGER NOT NULL,
          "unit_price" NUMERIC(10, 2) NOT NULL,
          "total_price" NUMERIC(10, 2) NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Create system_logs table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "system_logs" (
          "id" SERIAL PRIMARY KEY,
          "action" TEXT NOT NULL,
          "entity_type" TEXT NOT NULL,
          "entity_id" INTEGER,
          "description" TEXT,
          "performed_by" INTEGER REFERENCES "users"("id"),
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Create ai_settings table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "ai_settings" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER REFERENCES "users"("id"),
          "pharmacy_id" INTEGER REFERENCES "pharmacies"("id"),
          "setting_key" TEXT NOT NULL,
          "setting_value" JSONB NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      console.log('Schema applied successfully!');
    } catch (error) {
      console.error('Error applying schema:', error);
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
  console.error('Error in push-schema script:', err);
  process.exit(1);
});