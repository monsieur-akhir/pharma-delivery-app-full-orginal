// Ce script crée un utilitaire pour diagnostiquer les problèmes d'authentification
const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../backend/.env' });

async function diagnoseAuthenticationIssues() {
  console.log('🔍 Diagnostic des problèmes d\'authentification...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connexion à la base de données établie');

    // 1. Vérifier la structure de la table users
    const tableCheckQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    const tableResult = await client.query(tableCheckQuery);
    
    console.log('\n📋 Structure de la table users:');
    console.table(tableResult.rows);
    
    // 2. Vérifier les utilisateurs administrateurs
    const adminQuery = `
      SELECT id, username, email, phone, role, first_name, last_name, is_active, 
             password_hash IS NOT NULL AS has_password,
             LENGTH(password_hash) AS password_hash_length
      FROM users
      WHERE role IN ('ADMIN', 'PHARMACIST', 'PHARMACY_STAFF')
      ORDER BY id;
    `;
    
    const adminsResult = await client.query(adminQuery);
    
    console.log('\n👥 Utilisateurs administrateurs:');
    console.table(adminsResult.rows);
    
    // 3. Vérifier le format des hash de mot de passe
    const passwordHashesQuery = `
      SELECT id, username, SUBSTRING(password_hash FROM 1 FOR 60) AS password_hash_sample
      FROM users
      WHERE password_hash IS NOT NULL
      LIMIT 5;
    `;
    
    const passwordResult = await client.query(passwordHashesQuery);
    
    console.log('\n🔑 Échantillons de hash de mot de passe:');
    console.table(passwordResult.rows);
    
    // 4. Tester la fonctionnalité de bcrypt
    console.log('\n⚙️ Test de la fonctionnalité bcrypt:');
    
    const testPassword = 'test_password';
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(testPassword, salt);
      
      console.log(`✅ Génération de hash bcrypt: Succès`);
      console.log(`   Mot de passe test: "${testPassword}"`);
      console.log(`   Hash généré: "${hash}"`);
      
      const validCheck = await bcrypt.compare(testPassword, hash);
      console.log(`✅ Vérification bcrypt avec mot de passe correct: ${validCheck ? 'Succès' : 'Échec'}`);
      
      const invalidCheck = await bcrypt.compare('wrong_password', hash);
      console.log(`✅ Vérification bcrypt avec mot de passe incorrect: ${!invalidCheck ? 'Succès (rejeté comme prévu)' : 'Échec'}`);
    } catch (error) {
      console.error(`❌ Erreur lors des tests bcrypt: ${error.message}`);
    }

    // 5. Proposer des solutions
    console.log('\n🔧 Recommandations:');
    
    if (passwordResult.rows.some(row => !row.password_hash_sample.startsWith('$2'))) {
      console.log('❌ Certains hash de mot de passe semblent ne pas être au format bcrypt.');
      console.log('   Solution: Assurez-vous que tous les mots de passe sont hachés avec bcrypt.');
    }
    
    console.log('1. Vérifiez que le hash du mot de passe dans la base de données est au format bcrypt (commençant par "$2a$", "$2b$", etc.)');
    console.log('2. Ajoutez un traitement d\'erreur plus robuste dans la méthode de comparaison bcrypt');
    console.log('3. Assurez-vous que la version de bcrypt est compatible avec le format des hash stockés');
    console.log('4. Créez un utilisateur de test avec un nouveau mot de passe pour vérifier le processus d\'authentification');

  } catch (error) {
    console.error(`❌ Erreur lors du diagnostic: ${error.message}`);
  } finally {
    await client.end();
    console.log('\n✅ Diagnostic terminé.');
  }
}

diagnoseAuthenticationIssues();
