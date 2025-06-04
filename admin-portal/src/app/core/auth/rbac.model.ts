/**
 * Types de ressources disponibles dans l'application
 */
export enum Resource {
  USERS = 'users',
  PHARMACIES = 'pharmacies',
  MEDICINES = 'medicines',
  ORDERS = 'orders',
  PRESCRIPTIONS = 'prescriptions',
  AI_SETTINGS = 'ai_settings',
  AUDIT_LOGS = 'audit_logs',
  DASHBOARD = 'dashboard',
  SUPPLIER_ORDERS = 'supplier_orders',
  REMINDERS = 'reminders',
  DELIVERY_TRACKING = 'delivery_tracking'
}

/**
 * Actions possibles sur les ressources
 */
export enum Action {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  EXPORT = 'export'
}

/**
 * Rôles disponibles dans l'application
 */
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PHARMACIST = 'PHARMACIST',
  PHARMACY_STAFF = 'PHARMACY_STAFF',
  DELIVERY_PERSON = 'DELIVERY_PERSON',
  CUSTOMER = 'CUSTOMER',
  MANAGER = 'MANAGER',
  SUPPORT = 'SUPPORT',
  VIEWER = 'VIEWER'
}

/**
 * Interface représentant une permission spécifique
 */
export interface Permission {
  resource: Resource;
  action: Action;
}

/**
 * Interface définissant le profil d'un utilisateur avec son rôle et ses permissions
 */
export interface UserRoleProfile {
  role: Role;
  permissions: Permission[];
}

/**
 * Matrice de permissions par défaut pour chaque rôle
 */
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    // Super Admin a toutes les permissions
    ...Object.values(Resource).flatMap(resource => 
      Object.values(Action).map(action => ({
        resource,
        action
      }))
    )
  ],
  [Role.ADMIN]: [
    // Admin a toutes les permissions sauf gestion des rôles et accès aux paramètres sensibles
    ...Object.values(Resource).flatMap(resource => 
      Object.values(Action).map(action => ({
        resource,
        action
      }))
    ).filter(permission => 
      !(
        (permission.resource === Resource.USERS && 
          (permission.action === Action.CREATE || permission.action === Action.UPDATE)) ||
        (permission.resource === Resource.AI_SETTINGS) ||
        (permission.resource === Resource.AUDIT_LOGS) ||
        (permission.resource === Resource.SUPPLIER_ORDERS && 
          (permission.action === Action.CREATE || permission.action === Action.UPDATE))
      )
    )
  ],
  [Role.MANAGER]: [
    // Manager peut tout voir
    ...Object.values(Resource).map(resource => ({
      resource,
      action: Action.VIEW
    })),
    // Manager peut créer/modifier certains éléments
    { resource: Resource.USERS, action: Action.CREATE },
    { resource: Resource.USERS, action: Action.UPDATE },
    { resource: Resource.PHARMACIES, action: Action.UPDATE },
    { resource: Resource.PHARMACIES, action: Action.APPROVE },
    { resource: Resource.PHARMACIES, action: Action.REJECT },
    { resource: Resource.MEDICINES, action: Action.CREATE },
    { resource: Resource.MEDICINES, action: Action.UPDATE },
    { resource: Resource.ORDERS, action: Action.UPDATE },
    { resource: Resource.DASHBOARD, action: Action.EXPORT },
    { resource: Resource.AUDIT_LOGS, action: Action.EXPORT },
    { resource: Resource.SUPPLIER_ORDERS, action: Action.CREATE },
    { resource: Resource.SUPPLIER_ORDERS, action: Action.UPDATE }
  ],
  [Role.SUPPORT]: [
    // Support peut voir la plupart des éléments
    { resource: Resource.USERS, action: Action.VIEW },
    { resource: Resource.PHARMACIES, action: Action.VIEW },
    { resource: Resource.MEDICINES, action: Action.VIEW },
    { resource: Resource.ORDERS, action: Action.VIEW },
    { resource: Resource.PRESCRIPTIONS, action: Action.VIEW },
    { resource: Resource.DASHBOARD, action: Action.VIEW },
    { resource: Resource.SUPPLIER_ORDERS, action: Action.VIEW },
    { resource: Resource.REMINDERS, action: Action.VIEW },
    { resource: Resource.DELIVERY_TRACKING, action: Action.VIEW },
    // Support peut mettre à jour certains éléments
    { resource: Resource.ORDERS, action: Action.UPDATE },
    { resource: Resource.USERS, action: Action.UPDATE }
  ],
  [Role.VIEWER]: [
    // Viewer a uniquement des droits de lecture
    { resource: Resource.USERS, action: Action.VIEW },
    { resource: Resource.PHARMACIES, action: Action.VIEW },
    { resource: Resource.MEDICINES, action: Action.VIEW },
    { resource: Resource.ORDERS, action: Action.VIEW },
    { resource: Resource.DASHBOARD, action: Action.VIEW }
  ],
  [Role.PHARMACIST]: [
    // Pharmacien peut voir et gérer les médicaments et les ordonnances
    { resource: Resource.MEDICINES, action: Action.VIEW },
    { resource: Resource.MEDICINES, action: Action.CREATE },
    { resource: Resource.MEDICINES, action: Action.UPDATE },
    { resource: Resource.PRESCRIPTIONS, action: Action.VIEW },
    { resource: Resource.PRESCRIPTIONS, action: Action.CREATE },
    { resource: Resource.PRESCRIPTIONS, action: Action.UPDATE },
    // Accès au tableau de bord et aux rapports
    { resource: Resource.DASHBOARD, action: Action.VIEW },
    { resource: Resource.AUDIT_LOGS, action: Action.VIEW }
  ],
  [Role.PHARMACY_STAFF]: [
    // Personnel de la pharmacie peut voir et gérer les médicaments et les ordonnances
    { resource: Resource.MEDICINES, action: Action.VIEW },
    { resource: Resource.MEDICINES, action: Action.UPDATE },
    { resource: Resource.PRESCRIPTIONS, action: Action.VIEW },
    { resource: Resource.PRESCRIPTIONS, action: Action.UPDATE },
    // Accès au tableau de bord
    { resource: Resource.DASHBOARD, action: Action.VIEW }
  ],
  [Role.DELIVERY_PERSON]: [
    // Livreurs peuvent voir les commandes et les détails de livraison
    { resource: Resource.ORDERS, action: Action.VIEW },
    { resource: Resource.DELIVERY_TRACKING, action: Action.VIEW }
  ],
  [Role.CUSTOMER]: [
    // Clients peuvent voir leurs propres informations et commandes
    { resource: Resource.USERS, action: Action.VIEW },
    { resource: Resource.ORDERS, action: Action.VIEW },
    { resource: Resource.PRESCRIPTIONS, action: Action.VIEW }
  ]
};

/**
 * Mappings des routes aux ressources et actions requises
 */
export const routePermissions: Record<string, Permission[]> = {
  '/admin/dashboard': [{ resource: Resource.DASHBOARD, action: Action.VIEW }],
  '/admin/users': [{ resource: Resource.USERS, action: Action.VIEW }],
  '/admin/users/new': [{ resource: Resource.USERS, action: Action.CREATE }],
  '/admin/users/:id': [{ resource: Resource.USERS, action: Action.VIEW }],
  '/admin/users/:id/edit': [{ resource: Resource.USERS, action: Action.UPDATE }],
  '/admin/pharmacies': [{ resource: Resource.PHARMACIES, action: Action.VIEW }],
  '/admin/pharmacies/new': [{ resource: Resource.PHARMACIES, action: Action.CREATE }],
  '/admin/pharmacies/:id': [{ resource: Resource.PHARMACIES, action: Action.VIEW }],
  '/admin/pharmacies/:id/edit': [{ resource: Resource.PHARMACIES, action: Action.UPDATE }],
  '/admin/medicines': [{ resource: Resource.MEDICINES, action: Action.VIEW }],
  '/admin/medicines/new': [{ resource: Resource.MEDICINES, action: Action.CREATE }],
  '/admin/medicines/:id': [{ resource: Resource.MEDICINES, action: Action.VIEW }],
  '/admin/medicines/:id/edit': [{ resource: Resource.MEDICINES, action: Action.UPDATE }],
  '/admin/orders': [{ resource: Resource.ORDERS, action: Action.VIEW }],
  '/admin/orders/:id': [{ resource: Resource.ORDERS, action: Action.VIEW }],
  '/admin/prescriptions': [{ resource: Resource.PRESCRIPTIONS, action: Action.VIEW }],
  '/admin/ai-settings': [{ resource: Resource.AI_SETTINGS, action: Action.VIEW }],
  '/admin/audit-logs': [{ resource: Resource.AUDIT_LOGS, action: Action.VIEW }],
  '/admin/supplier-orders': [{ resource: Resource.SUPPLIER_ORDERS, action: Action.VIEW }],
  '/admin/supplier-orders/new': [{ resource: Resource.SUPPLIER_ORDERS, action: Action.CREATE }],
  '/admin/reminders': [{ resource: Resource.REMINDERS, action: Action.VIEW }],
  '/admin/delivery-tracking': [{ resource: Resource.DELIVERY_TRACKING, action: Action.VIEW }]
};