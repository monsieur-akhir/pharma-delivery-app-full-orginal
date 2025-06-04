import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Action, Permission, Resource, Role, UserRoleProfile, rolePermissions, routePermissions } from './rbac.model';

@Injectable({
  providedIn: 'root'
})
export class RbacService {
  private currentUserRole: Role | null = null;
  private userPermissions: Permission[] = [];

  constructor(private router: Router) {}

  /**
   * Initialiser le service RBAC avec les informations du rôle utilisateur connecté
   */
  public initializeUserRole(role: Role): void {
    this.currentUserRole = role;
    this.userPermissions = rolePermissions[role] || [];
  }

  /**
   * Nettoyer les informations de rôle (lors de la déconnexion)
   */
  public clearUserRole(): void {
    this.currentUserRole = null;
    this.userPermissions = [];
  }

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   */
  public hasPermission(resource: Resource, action: Action): boolean {
    if (!this.currentUserRole) {
      return false;
    }
    
    // Les super admins et admins ont automatiquement toutes les permissions
    if (this.currentUserRole === Role.SUPER_ADMIN || this.currentUserRole === Role.ADMIN) {
      return true;
    }
    
    return this.userPermissions.some(
      permission => permission.resource === resource && permission.action === action
    );
  }

  /**
   * Vérifier si l'utilisateur a au moins une des permissions spécifiées
   */
  public hasAnyPermission(permissions: Permission[]): boolean {
    if (!this.currentUserRole) {
      return false;
    }
    
    // Les super admins et admins ont automatiquement toutes les permissions
    if (this.currentUserRole === Role.SUPER_ADMIN || this.currentUserRole === Role.ADMIN) {
      return true;
    }
    
    return permissions.some(permission => 
      this.userPermissions.some(
        userPermission => 
          userPermission.resource === permission.resource && 
          userPermission.action === permission.action
      )
    );
  }

  /**
   * Vérifier si l'utilisateur a toutes les permissions spécifiées
   */
  public hasAllPermissions(permissions: Permission[]): boolean {
    if (!this.currentUserRole) {
      return false;
    }
    
    // Les super admins et admins ont automatiquement toutes les permissions
    if (this.currentUserRole === Role.SUPER_ADMIN || this.currentUserRole === Role.ADMIN) {
      return true;
    }
    
    return permissions.every(permission => 
      this.userPermissions.some(
        userPermission => 
          userPermission.resource === permission.resource && 
          userPermission.action === permission.action
      )
    );
  }

  /**
   * Vérifier si l'utilisateur a accès à une route spécifique
   */
  public canAccessRoute(route: string): boolean {
    if (!this.currentUserRole) {
      return false;
    }
    
    // Les super admins et admins ont automatiquement accès à toutes les routes
    if (this.currentUserRole === Role.SUPER_ADMIN || this.currentUserRole === Role.ADMIN) {
      return true;
    }
    
    // Trouver les permissions requises pour cette route
    // On gère d'abord les routes dynamiques avec des ID (:id)
    const routeSegments = route.split('/');
    const possibleMatchingRoutes = Object.keys(routePermissions)
      .filter(templateRoute => {
        const templateSegments = templateRoute.split('/');
        if (routeSegments.length !== templateSegments.length) {
          return false;
        }
        
        return templateSegments.every((segment, index) => {
          return segment === routeSegments[index] || segment.startsWith(':');
        });
      });
    
    // Si aucune route correspondante n'est trouvée, accorder l'accès par défaut
    if (possibleMatchingRoutes.length === 0) {
      return true;
    }
    
    // Vérifier les permissions pour les routes correspondantes
    for (const matchingRoute of possibleMatchingRoutes) {
      const requiredPermissions = routePermissions[matchingRoute] || [];
      if (this.hasAnyPermission(requiredPermissions)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Obtenir le rôle actuel de l'utilisateur
   */
  public getCurrentUserRole(): Role | null {
    return this.currentUserRole;
  }

  /**
   * Obtenir les permissions de l'utilisateur actuel
   */
  public getUserPermissions(): Permission[] {
    return [...this.userPermissions];
  }

  /**
   * Transférer l'utilisateur vers la page d'accès refusé
   */
  public navigateToAccessDenied(): void {
    this.router.navigate(['/admin/access-denied']);
  }
  
  /**
   * Récupère les permissions pour un rôle spécifique
   */
  public getPermissionsForRole(role: Role): Permission[] {
    return rolePermissions[role] || [];
  }
}