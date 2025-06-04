/**
 * Script pour vérifier si les tables de permissions existent dans la base de données
 */
const { Client } = require('pg');
require('dotenv').config();

async function checkPermissionTables() {
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connexion à la base de données pour vérification des tables...');
    await pgClient.connect();
    
    // Requête pour vérifier l'existence des tables
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('permissions', 'role_permissions')
    `;
    
    const result = await pgClient.query(query);
    
    console.log('\nVérification des tables de permissions:');
    if (result.rows.length === 0) {
      console.log('❌ Aucune table de permissions trouvée!');
      console.log('\nVous devez créer les tables avant d\'exécuter le script d\'initialisation:');
      console.log('node scripts/create-permission-tables.js');
      return false;
    }
    
    // Vérifier chaque table
    const tables = result.rows.map(row => row.table_name);
    
    if (tables.includes('permissions')) {
      console.log('✅ Table "permissions" existe');
    } else {
      console.log('❌ Table "permissions" non trouvée');
    }
    
    if (tables.includes('role_permissions')) {
      console.log('✅ Table "role_permissions" existe');
    } else {
      console.log('❌ Table "role_permissions" non trouvée');
    }
    
    const allTablesExist = tables.length === 2;
    
    if (allTablesExist) {
      console.log('\n✅ Toutes les tables requises existent.');
      console.log('Vous pouvez exécuter le script d\'initialisation des permissions:');
      console.log('node scripts/init-permissions.js');
    } else {
      console.log('\n⚠️ Certaines tables sont manquantes.');
      console.log('Exécutez d\'abord:');
      console.log('node scripts/create-permission-tables.js');
    }
    
    return allTablesExist;
    
  } catch (error) {
    console.error('Erreur lors de la vérification des tables:', error);
    return false;
  } finally {
    // Fermeture de la connexion dans tous les cas
    await pgClient.end();
  }
}

// Si le script est exécuté directement
if (require.main === module) {
  checkPermissionTables()
    .then(result => {
      if (!result) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Erreur inattendue:', err);
      process.exit(1);
    });
}

module.exports = { checkPermissionTables };
