import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Action, Permission, Resource, Role, rolePermissions } from '../../../core/auth/rbac.model';
import { RbacService } from '../../../core/auth/rbac.service';
import { AuthService, User } from '../../../core/auth/auth.service';
import { UsersService } from '../users.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-roles',
  templateUrl: './user-roles.component.html',
  styleUrls: ['./user-roles.component.scss']
})
export class UserRolesComponent implements OnInit {
  users: User[] = [];
  roles = Object.values(Role);
  allResources = Object.values(Resource);
  allActions = Object.values(Action);
  
  // Tableau des utilisateurs
  displayedColumns: string[] = ['username', 'email', 'currentRole', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  
  // Tableau des permissions par rôle
  rolePermissionColumns: string[] = ['resource', ...Object.values(Role)];
  rolePermissionsMatrix: { resource: Resource, [key: string]: any }[] = [];
  
  isLoading = true;
  error: string | null = null;

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private rbacService: RbacService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.prepareRolePermissionsMatrix();
  }

  /**
   * Charger la liste des utilisateurs
   */
  loadUsers(): void {
    this.isLoading = true;
    
    this.usersService.getUsers()
      .subscribe(
        users => {
          this.users = users;
          this.dataSource.data = users;
          this.isLoading = false;
        },
        error => {
          console.error('Error loading users', error);
          this.error = 'Impossible de charger la liste des utilisateurs. Veuillez réessayer.';
          this.isLoading = false;
        }
      );
  }

  /**
   * Préparer la matrice d'affichage des permissions par rôle
   */
  prepareRolePermissionsMatrix(): void {
    // Créer un dictionnaire des permissions par rôle
    const rolePermissionsMap: Record<Role, Record<string, boolean>> = {} as any;
    
    // Initialiser le dictionnaire
    for (const role of Object.values(Role)) {
      rolePermissionsMap[role] = {};
      
      // Obtenir toutes les permissions pour ce rôle
      const permissions = this.rbacService.getPermissionsForRole(role);
      
      // Marquer chaque permission comme activée
      for (const permission of permissions) {
        const key = `${permission.resource}:${permission.action}`;
        rolePermissionsMap[role][key] = true;
      }
    }
    
    // Créer la matrice pour chaque ressource et action
    for (const resource of this.allResources) {
      const resourceRow = { resource };
      
      // Pour chaque rôle, vérifier quelles actions sont autorisées sur cette ressource
      for (const role of Object.values(Role)) {
        resourceRow[role] = this.allActions.filter(action => {
          const key = `${resource}:${action}`;
          return rolePermissionsMap[role][key];
        });
      }
      
      this.rolePermissionsMatrix.push(resourceRow);
    }
  }

  /**
   * Mettre à jour le rôle d'un utilisateur
   */
  updateUserRole(user: User, newRole: Role): void {
    if (user.role === newRole) return;
    
    // Vérifier si l'utilisateur connecté a la permission de modifier les rôles
    if (!this.rbacService.hasPermission(Resource.USERS, Action.UPDATE)) {
      this.snackBar.open('Vous n\'avez pas la permission de modifier les rôles utilisateurs.', 'Fermer', {
        duration: 3000
      });
      return;
    }
    
    // Confirmer l'action si l'utilisateur modifie son propre rôle
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id === user.id) {
      const confirm = window.confirm(
        'Vous êtes sur le point de modifier votre propre rôle. Cela pourrait restreindre votre accès à certaines fonctionnalités. Continuer ?'
      );
      
      if (!confirm) return;
    }
    
    this.authService.updateUserRole(user.id, newRole)
      .subscribe(
        updatedUser => {
          // Mettre à jour l'utilisateur dans la liste
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
            this.dataSource.data = [...this.users];
          }
          
          this.snackBar.open(`Le rôle de ${user.username} a été mis à jour avec succès.`, 'Fermer', {
            duration: 3000
          });
        },
        error => {
          console.error('Error updating user role', error);
          this.snackBar.open(`Erreur lors de la mise à jour du rôle de ${user.username}.`, 'Fermer', {
            duration: 3000
          });
        }
      );
  }

  /**
   * Vérifier si l'utilisateur connecté a la permission de modifier les rôles
   */
  canUpdateRoles(): boolean {
    return this.rbacService.hasPermission(Resource.USERS, Action.UPDATE);
  }

  /**
   * Vérifier si l'utilisateur connecté peut modifier le rôle d'un utilisateur spécifique
   */
  canUpdateUserRole(user: User): boolean {
    if (!this.canUpdateRoles()) return false;
    
    // L'administrateur peut modifier n'importe quel rôle
    if (this.authService.hasRole(Role.ADMIN)) return true;
    
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;
    
    // Un utilisateur ne peut pas modifier le rôle d'un administrateur sauf s'il est lui-même administrateur
    if (user.role === Role.ADMIN && currentUser.role !== Role.ADMIN) return false;
    
    return true;
  }

  /**
   * Obtenir la classe CSS pour une action dans la matrice de permissions
   */
  getPermissionClass(resource: Resource, role: Role, actions: Action[]): string {
    if (!actions || actions.length === 0) return 'no-permissions';
    if (actions.length === this.allActions.length) return 'full-permissions';
    return 'partial-permissions';
  }

  /**
   * Obtenir le texte à afficher pour les permissions
   */
  getPermissionText(resource: Resource, role: Role, actions: Action[]): string {
    if (!actions || actions.length === 0) return 'Aucune';
    if (actions.length === this.allActions.length) return 'Toutes';
    
    const sortedActions = [...actions].sort((a, b) => a.localeCompare(b));
    return sortedActions.join(', ');
  }
}