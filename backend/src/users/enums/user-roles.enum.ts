export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PHARMACY_STAFF = 'PHARMACY_STAFF',
  PHARMACIST = 'PHARMACIST',
  DELIVERY_PERSON = 'DELIVERY_PERSON',
  CUSTOMER = 'CUSTOMER',

  // Alias pour la compatibilité avec le code existant
  PHARMACY_ADMIN = 'PHARMACY_STAFF', // Alias de PHARMACY_STAFF pour la rétrocompatibilité
  USER = 'CUSTOMER' // Alias de CUSTOMER pour la rétrocompatibilité
}
