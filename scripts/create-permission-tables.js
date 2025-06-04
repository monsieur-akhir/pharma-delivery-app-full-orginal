/**
 * Script pour créer les tables de permissions dans la base de données
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function createPermissionTables() {
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connexion à la base de données...');
    await pgClient.connect();
    console.log('Connexion établie.');

    // Lire le contenu du fichier SQL
    const sqlFilePath = path.join(__dirname, 'create-permission-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Exécution du script SQL pour créer les tables de permissions...');
    
    // Exécution du script SQL
    await pgClient.query(sqlContent);
    
    console.log('Tables de permissions créées ou vérifiées avec succès!');
    console.log('Vous pouvez maintenant exécuter le script d\'initialisation des permissions:');
    console.log('node scripts/init-permissions.js');
    
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
    process.exit(1);
  } finally {
    // Fermeture de la connexion dans tous les cas
    await pgClient.end();
  }
}

// Exécution du script
createPermissionTables();
