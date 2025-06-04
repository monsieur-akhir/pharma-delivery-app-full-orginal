import { User as CoreUser, UserStatus, UserRole } from '../../core/models/user.model';
import { User as SharedUser } from '../../shared/models/user.model';

/**
 * Classe utilitaire pour convertir entre les différentes implémentations du modèle User
 */
export class UserAdapter {
  /**
   * Convertit un User du modèle core en User du modèle shared
   */
  static coreToShared(coreUser: CoreUser): SharedUser {
    return {
      id: String(coreUser.id),
      username: coreUser.username,
      email: coreUser.email,
      phone: coreUser.phone || '',
      role: this.mapRole(coreUser.role),
      isActive: coreUser.status === 'ACTIVE',
      firstName: coreUser.name?.split(' ')[0],
      lastName: coreUser.name?.split(' ')[1] || '',
      createdAt: coreUser.createdAt,
      updatedAt: new Date(),
      lastLogin: coreUser.lastLoginAt,
      address: coreUser.address,
    };
  }

  /**
   * Convertit un User du modèle shared en User du modèle core
   */
  static sharedToCore(sharedUser: SharedUser): CoreUser {
    return {
      id: Number(sharedUser.id),
      username: sharedUser.username,
      email: sharedUser.email || '',
      role: this.mapRoleToCore(sharedUser.role),
      status: sharedUser.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE,
      name: `${sharedUser.firstName || ''} ${sharedUser.lastName || ''}`.trim(),
      phone: sharedUser.phone,
      address: sharedUser.address,
      createdAt: sharedUser.createdAt,
      lastLoginAt: sharedUser.lastLogin
    };
  }

  private static mapRole(coreRole: string): SharedUser['role'] {
    // Map from core model role to shared model role
    switch (coreRole) {
      case 'ADMIN':
        return 'ADMIN';
      case 'PHARMACY_OWNER':
        return 'PHARMACY_STAFF';
      case 'PHARMACY_STAFF':
        return 'PHARMACY_STAFF';
      case 'DELIVERY_PERSON':
        return 'DELIVERY_PERSON';
      case 'CUSTOMER':
        return 'CUSTOMER';
      default:
        return 'VIEWER';
    }
  }
  private static mapRoleToCore(sharedRole: SharedUser['role']): UserRole {
    // Map from shared model role to core model role
    switch (sharedRole) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'MANAGER':
        return UserRole.ADMIN;
      case 'PHARMACY_STAFF':
      case 'PHARMACIST':
        return UserRole.PHARMACY_STAFF;
      case 'DELIVERY_PERSON':
        return UserRole.DELIVERY_PERSON;
      case 'CUSTOMER':
        return UserRole.CUSTOMER;
      case 'SUPPORT':
      case 'VIEWER':
        return UserRole.ADMIN;
      default:
        return UserRole.CUSTOMER;
    }
  }
}
