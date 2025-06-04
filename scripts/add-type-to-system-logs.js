// Ce script ajoute la colonne 'type' à la table system_logs
const { Client } = require('pg');
require('dotenv').config();

async function addTypeColumnToSystemLogs() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to the database');

    // Vérifier si la colonne existe déjà
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'system_logs' AND column_name = 'data';
    `;
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length === 0) {
      // La colonne n'existe pas, l'ajouter
      const addColumnQuery = `
        ALTER TABLE system_logs
        ADD COLUMN data TEXT;
      `;
      await client.query(addColumnQuery);
      console.log('Column "data" added successfully to the system_logs table');
    } else {
      console.log('Column "data" already exists in the system_logs table');
    }

  } catch (error) {
    console.error('Error executing migration:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

addTypeColumnToSystemLogs();
