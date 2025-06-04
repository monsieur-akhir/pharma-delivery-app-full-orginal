// Script pour créer les utilisateurs d'authentification pour le back-office
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { users } = require('../shared/schema');
const { hash } = require('bcrypt');
const { eq } = require('drizzle-orm');

// Connexion à la base de données
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createAuthUsers() {
  const db = drizzle(pool);
  
  console.log('Création des utilisateurs pour l\'authentification du back-office...');
  
  // Liste des utilisateurs à créer
  const authUsers = [
    {
      username: 'admin',
      email: 'admin@pharmacie-app.com',
      password: 'Admin@123', // Mot de passe temporaire, à changer en production
      firstName: 'Admin',
      lastName: 'Système',
      role: 'ADMIN',
      phoneNumber: '+33600000000',
    },
    {
      username: 'pharmacie1',
      email: 'pharmacie1@pharmacie-app.com',
      password: 'Pharmacie@123', // Mot de passe temporaire, à changer en production
      firstName: 'Gérant',
      lastName: 'Pharmacie1',
      role: 'PHARMACIST',
      phoneNumber: '+33600000001',
    },
    {
      username: 'pharmacie2',
      email: 'pharmacie2@pharmacie-app.com',
      password: 'Pharmacie@123', // Mot de passe temporaire, à changer en production
      firstName: 'Gérant',
      lastName: 'Pharmacie2',
      role: 'PHARMACIST',
      phoneNumber: '+33600000002',
    }
  ];
  
  // Créer chaque utilisateur s'il n'existe pas déjà
  for (const userData of authUsers) {
    console.log(`Vérification de l'utilisateur ${userData.username}...`);
    
    const existingUser = await db.select().from(users).where(eq(users.username, userData.username));
    
    if (existingUser.length > 0) {
      console.log(`L'utilisateur ${userData.username} existe déjà.`);
      continue;
    }
    
    console.log(`Création de l'utilisateur ${userData.username}...`);
    
    // Génération du hash du mot de passe
    const saltRounds = 10;
    const passwordHash = await hash(userData.password, saltRounds);
    
    // Préparation des données utilisateur
    const userToInsert = {
      username: userData.username,
      email: userData.email,
      phone: userData.phoneNumber,
      role: userData.role,
      address: 'Non spécifié',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      password_hash: passwordHash,
      first_name: userData.firstName,
      last_name: userData.lastName
    };
    
    // Insertion dans la base de données
    try {
      await db.insert(users).values(userToInsert);
      console.log(`Utilisateur ${userData.username} créé avec succès !`);
      console.log(`Email: ${userData.email}`);
      console.log(`Mot de passe: ${userData.password}`);
    } catch (error) {
      console.error(`Erreur lors de la création de l'utilisateur ${userData.username}:`, error);
    }
  }
  
  // Fermer la connexion à la base de données
  await pool.end();
  console.log('Création des utilisateurs terminée.');
}

createAuthUsers().catch(error => {
  console.error('Erreur lors de la création des utilisateurs:', error);
  process.exit(1);
});