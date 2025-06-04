// Script pour créer un utilisateur admin par défaut
const { pool } = require('../server/db');
const { users } = require('../shared/schema');
const { hash } = require('bcrypt');
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq } = require('drizzle-orm');

async function createAdminUser() {
  const db = drizzle(pool);
  
  console.log('Vérification si l\'utilisateur admin existe déjà...');
  
  const adminEmail = 'admin-back-office@yopmail.com';
  const existingUser = await db.select().from(users).where(eq(users.email, adminEmail));
  
  if (existingUser.length > 0) {
    console.log('L\'utilisateur admin existe déjà.');
    return;
  }
  
  console.log('Création de l\'utilisateur admin...');
  
  // Génération du hash du mot de passe
  const saltRounds = 10;
  const password = 'Admin@123';
  const passwordHash = await hash(password, saltRounds);
  
  // Création de l'utilisateur admin
  const adminUser = {
    username: 'admin',
    email: adminEmail,
    password: passwordHash,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    phoneNumber: '+1234567890',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Insertion dans la base de données
  await db.insert(users).values(adminUser);
  
  console.log('Utilisateur admin créé avec succès !');
  console.log('Email: ' + adminEmail);
  console.log('Mot de passe: ' + password);
  
  // Fermer la connexion à la base de données
  await pool.end();
}

createAdminUser().catch(error => {
  console.error('Erreur lors de la création de l\'utilisateur admin:', error);
  process.exit(1);
});