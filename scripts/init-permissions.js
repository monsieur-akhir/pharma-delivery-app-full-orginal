/**
 * Script pour initialiser les permissions et les assigner aux rôles
 */
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq } = require('drizzle-orm');
const { Client } = require('pg');
require('dotenv').config();
const { checkPermissionTables } = require('./check-permission-tables');

async function initPermissions() {
  // Vérifier d'abord que les tables existent
  const tablesExist = await checkPermissionTables();
  if (!tablesExist) {
    console.log('\n⚠️ Les tables nécessaires ne sont pas disponibles.');
    console.log('Exécutez d\'abord: node scripts/create-permission-tables.js');
    process.exit(1);
  }
  
  console.log('\nContinuation de l\'initialisation des permissions...');
  // Connexion à la base de données
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await pgClient.connect();
  const db = drizzle(pgClient);
  console.log('Connexion à la base de données établie.');
  // Import des définitions de schéma
  const { permissions, role_permissions } = require('./schema-permissions.js');

  console.log('Initialisation des permissions...');

  // Définir les permissions de base par catégorie
  const basePermissions = [
    // Permissions utilisateurs
    { name: 'user:create', category: 'users', description: 'Créer des utilisateurs' },
    { name: 'user:read', category: 'users', description: 'Voir les utilisateurs' },
    { name: 'user:update', category: 'users', description: 'Modifier les utilisateurs' },
    { name: 'user:delete', category: 'users', description: 'Supprimer des utilisateurs' },
    { name: 'user:manage_roles', category: 'users', description: 'Gérer les rôles des utilisateurs' },

    // Permissions pharmacies
    { name: 'pharmacy:create', category: 'pharmacies', description: 'Créer des pharmacies' },
    { name: 'pharmacy:read', category: 'pharmacies', description: 'Voir les pharmacies' },
    { name: 'pharmacy:update', category: 'pharmacies', description: 'Modifier les pharmacies' },
    { name: 'pharmacy:delete', category: 'pharmacies', description: 'Supprimer des pharmacies' },
    { name: 'pharmacy:approve', category: 'pharmacies', description: 'Approuver des pharmacies' },

    // Permissions médicaments
    { name: 'medicine:create', category: 'medicines', description: 'Créer des médicaments' },
    { name: 'medicine:read', category: 'medicines', description: 'Voir les médicaments' },
    { name: 'medicine:update', category: 'medicines', description: 'Modifier des médicaments' },
    { name: 'medicine:delete', category: 'medicines', description: 'Supprimer des médicaments' },

    // Permissions commandes
    { name: 'order:create', category: 'orders', description: 'Créer des commandes' },
    { name: 'order:read', category: 'orders', description: 'Voir les commandes' },
    { name: 'order:update', category: 'orders', description: 'Modifier des commandes' },
    { name: 'order:cancel', category: 'orders', description: 'Annuler des commandes' },
    
    // Permissions livraisons
    { name: 'delivery:create', category: 'deliveries', description: 'Créer des livraisons' },
    { name: 'delivery:read', category: 'deliveries', description: 'Voir les livraisons' },
    { name: 'delivery:update', category: 'deliveries', description: 'Modifier des livraisons' },
    
    // Permissions système
    { name: 'system:logs', category: 'system', description: 'Voir les logs système' },
    { name: 'system:settings', category: 'system', description: 'Modifier les paramètres système' },
    { name: 'system:permissions', category: 'system', description: 'Gérer les permissions' },

    // Permissions analyses
    { name: 'analytics:view', category: 'analytics', description: 'Voir les analyses' },
    { name: 'analytics:export', category: 'analytics', description: 'Exporter les données d\'analyse' },
  ];

  // Ajouter les permissions
  let addedCount = 0;
  for (const perm of basePermissions) {
    const existingPerm = await db
      .select()
      .from(permissions)
      .where(eq(permissions.name, perm.name));
    
    if (existingPerm.length === 0) {
      await db.insert(permissions).values({
        name: perm.name,
        category: perm.category,
        description: perm.description,
        created_at: new Date(),
        updated_at: new Date()
      });
      addedCount++;
    }
  }

  console.log(`${addedCount} permissions ajoutées, ${basePermissions.length - addedCount} existaient déjà.`);

  // Configurer les permissions par rôle
  console.log('Configuration des permissions par rôle...');

  // Récupérer toutes les permissions
  const allPerms = await db.select().from(permissions);
  const permMap = {};
  allPerms.forEach(p => {
    permMap[p.name] = p.id;
  });

  // Définir les permissions pour chaque rôle
  const roleMappings = [
    {
      role: 'SUPER_ADMIN',
      permissions: Object.values(permMap) // Toutes les permissions
    },
    {
      role: 'ADMIN',
      permissions: [
        // Accès utilisateurs limité
        permMap['user:read'],
        permMap['user:create'],
        permMap['user:update'],
        
        // Accès complet aux pharmacies
        permMap['pharmacy:read'],
        permMap['pharmacy:create'],
        permMap['pharmacy:update'],
        permMap['pharmacy:delete'],
        permMap['pharmacy:approve'],
        
        // Accès médicaments
        permMap['medicine:read'],
        permMap['medicine:create'],
        permMap['medicine:update'],
        
        // Commandes et livraisons
        permMap['order:read'],
        permMap['order:update'],
        permMap['delivery:read'],
        permMap['delivery:update'],
        
        // Analytique
        permMap['analytics:view'],
        permMap['analytics:export'],
        
        // Logs système
        permMap['system:logs'],
      ]
    },
    {
      role: 'PHARMACIST',
      permissions: [
        // Accès utilisateurs très limité
        permMap['user:read'],
        
        // Accès limité aux pharmacies
        permMap['pharmacy:read'],
        
        // Accès complet aux médicaments
        permMap['medicine:read'],
        permMap['medicine:create'],
        permMap['medicine:update'],
        permMap['medicine:delete'],
        
        // Commandes
        permMap['order:read'],
        permMap['order:update'],
      ]
    },
    {
      role: 'PHARMACY_STAFF',
      permissions: [
        // Accès médicaments
        permMap['medicine:read'],
        
        // Commandes
        permMap['order:read'],
        permMap['order:update'],
      ]
    },
    {
      role: 'DELIVERY_PERSON',
      permissions: [
        // Livraisons
        permMap['delivery:read'],
        permMap['delivery:update'],
        
        // Commandes (lecture seule)
        permMap['order:read'],
      ]
    },
    {
      role: 'CUSTOMER',
      permissions: [
        // Commandes (ses commandes uniquement, appliqué via le code)
        permMap['order:create'],
        permMap['order:read'],
        permMap['order:cancel'],
      ]
    }
  ];

  // Supprimer les anciennes associations pour éviter les doublons
  for (const mapping of roleMappings) {
    await db.delete(role_permissions).where(eq(role_permissions.role, mapping.role));
  }

  // Ajouter les nouvelles associations
  for (const mapping of roleMappings) {
    for (const permId of mapping.permissions) {
      await db.insert(role_permissions).values({
        role: mapping.role,
        permission_id: permId,
        created_at: new Date()
      });
    }
    console.log(`Permissions configurées pour le rôle ${mapping.role}`);
  }
  console.log('Initialisation des permissions terminée avec succès !');

  // Fermer la connexion à la base de données
  await pgClient.end();
}

// Exécution du script
initPermissions().catch(error => {
  console.error('Erreur lors de l\'initialisation des permissions:', error);
  process.exit(1);
});
