import { Component, OnInit } from '@angular/core';
import { PermissionsService } from '../../core/services/permissions.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';

interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
  granted?: boolean;
}

@Component({
  selector: 'app-role-permissions',
  templateUrl: './role-permissions.component.html',
  styleUrls: ['./role-permissions.component.scss']
})
export class RolePermissionsComponent implements OnInit {
  readonly roles: string[] = ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'PHARMACY_STAFF', 'DELIVERY_PERSON', 'CUSTOMER'];
  selectedRole: string = 'ADMIN';
  permissions: Permission[] = [];
  permissionsByCategory: Record<string, Permission[]> = {};
  categories: string[] = [];
  loading: boolean = false;
  saving: boolean = false;
  selectedPermissionIds: number[] = [];

  constructor(
    private permissionsService: PermissionsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadRolePermissions();
  }

  loadRolePermissions(): void {
    this.loading = true;
    this.permissionsService.getPermissionsByRole(this.selectedRole)
      .pipe(
        catchError(error => {
          this.showError('Erreur lors du chargement des permissions', error);
          return of({ permissions: [], groupedPermissions: {} });
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(data => {
        this.permissions = data.permissions ?? [];
        this.permissionsByCategory = data.groupedPermissions ?? {};
        this.categories = Object.keys(this.permissionsByCategory);
        this.selectedPermissionIds = this.permissions
          .filter(p => p.granted)
          .map(p => p.id);
      });
  }

  onRoleChange(event: MatSelectChange): void {
    this.selectedRole = event.value;
    this.loadRolePermissions();
  }

  togglePermission(permission: Permission): void {
    const permissionId = permission.id;
    const index = this.selectedPermissionIds.indexOf(permissionId);
    if (index === -1) {
      this.selectedPermissionIds.push(permissionId);
    } else {
      this.selectedPermissionIds.splice(index, 1);
    }
  }

  isPermissionSelected(permissionId: number): boolean {
    return this.selectedPermissionIds.includes(permissionId);
  }

  selectAllInCategory(category: string): void {
    const categoryPermissions = this.permissionsByCategory[category] ?? [];
    categoryPermissions.forEach(permission => {
      if (!this.selectedPermissionIds.includes(permission.id)) {
        this.selectedPermissionIds.push(permission.id);
      }
    });
  }

  deselectAllInCategory(category: string): void {
    const categoryPermissions = this.permissionsByCategory[category] ?? [];
    this.selectedPermissionIds = this.selectedPermissionIds.filter(
      id => !categoryPermissions.some(p => p.id === id)
    );
  }

  areAllCategoryPermissionsSelected(category: string): boolean {
    const categoryPermissions = this.permissionsByCategory[category] ?? [];
    return categoryPermissions.length > 0 && 
           categoryPermissions.every(p => this.selectedPermissionIds.includes(p.id));
  }

  getCategorySelectedCount(category: string): number {
    return (this.permissionsByCategory[category] ?? [])
      .filter(p => this.selectedPermissionIds.includes(p.id))
      .length;
  }

  savePermissions(): void {
    this.saving = true;
    this.permissionsService.updateRolePermissions(this.selectedRole, this.selectedPermissionIds)
      .pipe(
        catchError(error => {
          this.showError('Erreur lors de l\'enregistrement des permissions', error);
          return of(null);
        }),
        finalize(() => this.saving = false)
      )
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Permissions mises à jour avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      });
  }

  navigateToUserPermissions(): void {
    this.router.navigate(['user-permissions'], { relativeTo: this.route });
  }

  private showError(message: string, error: any): void {
    this.snackBar.open(`${message}: ${error.message || 'Erreur inconnue'}`, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}