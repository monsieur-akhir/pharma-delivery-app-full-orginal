/**
 * Script pour créer un utilisateur SUPER_ADMIN
 */
const { pool } = require('../server/db');
const { hash } = require('bcrypt');
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq } = require('drizzle-orm');

async function createSuperAdmin() {
  // Connexion à la base de données
  const db = drizzle(pool);
  
  // Import des définitions de schéma
  const { users } = require('../shared/src/schema');

  console.log('Vérification si l\'utilisateur super admin existe déjà...');

  const superAdminEmail = 'super-admin@mediconnect.com';
  const existingUser = await db.select().from(users).where(eq(users.email, superAdminEmail));

  if (existingUser.length > 0) {
    console.log('L\'utilisateur super admin existe déjà.');
    return;
  }

  console.log('Création de l\'utilisateur super admin...');

  // Génération du hash du mot de passe
  const saltRounds = 10;
  const password = 'SuperAdmin@123';
  const passwordHash = await hash(password, saltRounds);

  // Création de l'utilisateur super admin
  await db.insert(users).values({
    username: 'superadmin',
    email: superAdminEmail,
    phone: '+33123456789',
    role: 'SUPER_ADMIN',
    password_hash: passwordHash,
    first_name: 'Super',
    last_name: 'Admin',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  });

  console.log('Utilisateur Super Admin créé avec succès !');
  console.log('--------------------------------------');
  console.log('Email: ' + superAdminEmail);
  console.log('Mot de passe: ' + password);
  console.log('Rôle: SUPER_ADMIN');
  console.log('--------------------------------------');
  console.log('ATTENTION: Notez ces identifiants et changez le mot de passe après la première connexion.');

  // Fermer la connexion à la base de données
  await pool.end();
}

// Exécution du script
createSuperAdmin().catch(error => {
  console.error('Erreur lors de la création de l\'utilisateur super admin:', error);
  process.exit(1);
});
