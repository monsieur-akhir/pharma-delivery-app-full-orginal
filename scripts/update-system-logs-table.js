// Ce script met à jour la structure de la table system_logs
const { Client } = require('pg');
require('dotenv').config();

async function updateSystemLogsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to the database');

    // 1. Vérifier si la colonne action est NULL-able
    const alterActionColumn = `
      ALTER TABLE system_logs 
      ALTER COLUMN action DROP NOT NULL;
    `;
    
    await client.query(alterActionColumn);
    console.log('Column "action" modified to accept NULL values');

    // 2. Vérifier la présence de la colonne entity
    const checkEntityColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'system_logs' AND column_name = 'entity';
    `;
    const entityResult = await client.query(checkEntityColumnQuery);
    
    // Si entity n'existe pas, l'ajouter mais permettre NULL
    if (entityResult.rows.length === 0) {
      const addEntityColumn = `
        ALTER TABLE system_logs
        ADD COLUMN entity TEXT;
      `;
      await client.query(addEntityColumn);
      console.log('Column "entity" added as nullable');
    } else {
      // Si elle existe mais est NOT NULL, la modifier
      const alterEntityColumn = `
        ALTER TABLE system_logs 
        ALTER COLUMN entity DROP NOT NULL;
      `;
      await client.query(alterEntityColumn);
      console.log('Column "entity" modified to accept NULL values');
    }

    // 3. Ajouter une colonne "message" si elle n'existe pas
    const checkMessageColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'system_logs' AND column_name = 'message';
    `;
    const messageResult = await client.query(checkMessageColumnQuery);
    
    if (messageResult.rows.length === 0) {
      const addMessageColumn = `
        ALTER TABLE system_logs
        ADD COLUMN message TEXT;
      `;
      await client.query(addMessageColumn);
      console.log('Column "message" added successfully');
    } else {
      console.log('Column "message" already exists');
    }

    // 4. Ajouter une colonne "data" si elle n'existe pas
    const checkDataColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'system_logs' AND column_name = 'data';
    `;
    const dataResult = await client.query(checkDataColumnQuery);
    
    if (dataResult.rows.length === 0) {
      const addDataColumn = `
        ALTER TABLE system_logs
        ADD COLUMN data TEXT;
      `;
      await client.query(addDataColumn);
      console.log('Column "data" added successfully');
    } else {
      console.log('Column "data" already exists');
    }

  } catch (error) {
    console.error('Error updating system_logs table:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

updateSystemLogsTable();
