/**
 * Script pour mettre à jour l'enum user_role pour inclure SUPER_ADMIN
 */
const { Client } = require('pg');
require('dotenv').config();

async function updateUserRoleEnum() {
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connexion à la base de données...');
    await pgClient.connect();
    console.log('Connexion établie.');

    // Vérifier les valeurs actuelles de l'enum
    console.log('Vérification des valeurs actuelles de l\'enum user_role...');
    const enumQuery = `
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
      ORDER BY enumlabel;
    `;
    
    const currentValues = await pgClient.query(enumQuery);
    console.log('Valeurs actuelles:', currentValues.rows.map(row => row.enumlabel));

    // Vérifier si SUPER_ADMIN existe déjà
    const hasSuperAdmin = currentValues.rows.some(row => row.enumlabel === 'SUPER_ADMIN');
    
    if (hasSuperAdmin) {
      console.log('✅ SUPER_ADMIN existe déjà dans l\'enum user_role');
    } else {
      console.log('Ajout de SUPER_ADMIN à l\'enum user_role...');
      
      // Ajouter SUPER_ADMIN à l'enum
      await pgClient.query(`
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
      `);
      
      console.log('✅ SUPER_ADMIN ajouté à l\'enum user_role');
    }

    // Vérifier si MANAGER, SUPPORT, et VIEWER existent
    const expectedValues = ['MANAGER', 'SUPPORT', 'VIEWER'];
    for (const value of expectedValues) {
      const hasValue = currentValues.rows.some(row => row.enumlabel === value);
      if (!hasValue) {
        console.log(`Ajout de ${value} à l'enum user_role...`);
        await pgClient.query(`
          ALTER TYPE user_role ADD VALUE IF NOT EXISTS '${value}';
        `);
        console.log(`✅ ${value} ajouté à l'enum user_role`);
      } else {
        console.log(`✅ ${value} existe déjà dans l'enum user_role`);
      }
    }

    // Vérifier les nouvelles valeurs
    console.log('\nVérification des valeurs mises à jour...');
    const updatedValues = await pgClient.query(enumQuery);
    console.log('Valeurs mises à jour:', updatedValues.rows.map(row => row.enumlabel));

    console.log('\n✅ Mise à jour de l\'enum user_role terminée avec succès!');
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'enum:', error);
    process.exit(1);
  } finally {
    await pgClient.end();
  }
}

// Exécution du script
if (require.main === module) {
  updateUserRoleEnum();
}

module.exports = { updateUserRoleEnum };
