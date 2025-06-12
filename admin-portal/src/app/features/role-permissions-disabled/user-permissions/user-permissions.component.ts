import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, catchError, debounceTime, distinctUntilChanged, finalize, of, startWith, switchMap } from 'rxjs';
import { PermissionsService } from '../permissions.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-permissions',
  templateUrl: './user-permissions.component.html',
  styleUrls: ['./user-permissions.component.scss'],
  standalone: true,  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatCardModule,
    MatTableModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule,
    MatButtonToggleModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class UserPermissionsComponent implements OnInit {
  searchControl = new FormControl('');
  filteredUsers: Observable<any[]>;
  selectedUser: any = null;
  permissionsByCategory: any = {};
  categories: string[] = [];
  permissions: any[] = [];
  loading = false;
  saving = false;
  displayedColumns: string[] = ['name', 'roleDefault', 'userOverride'];
  
  constructor(
    private permissionsService: PermissionsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filteredUsers = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => this.searchUsers(value || ''))
    );
  }

  ngOnInit(): void {
    // Initialize component
  }

  searchUsers(value: string): Observable<any[]> {
    // Mock implementation - in a real app, this would call an API
    return of([
      { id: 1, username: 'john.doe', name: 'John Doe', email: 'john.doe@example.com', role: 'ADMIN' },
      { id: 2, username: 'jane.smith', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'PHARMACIST' },
      { id: 3, username: 'admin', name: 'Admin User', email: 'admin@example.com', role: 'SUPER_ADMIN' }
    ].filter(user => 
      user.name.toLowerCase().includes(value.toLowerCase()) || 
      user.username.toLowerCase().includes(value.toLowerCase()) ||
      user.email.toLowerCase().includes(value.toLowerCase())
    ));
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.loadUserPermissions(user.id);
  }

  loadUserPermissions(userId: number): void {
    this.loading = true;
    this.permissionsService.getUserPermissions(userId)
      .pipe(
        catchError(error => {
          this.snackBar.open(`Error loading user permissions: ${error.message}`, 'Close', {
            duration: 5000
          });
          return of({ permissions: [], groupedPermissions: {} });
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(data => {
        this.permissions = data.permissions || [];
        this.permissionsByCategory = data.groupedPermissions || {};
        this.categories = Object.keys(this.permissionsByCategory);
      });
  }

  updateUserPermission(permissionId: number, granted: boolean): void {
    if (!this.selectedUser) return;
    
    this.saving = true;
    this.permissionsService.setUserPermission(this.selectedUser.id, permissionId, granted)
      .pipe(
        catchError(error => {
          this.snackBar.open(`Error updating permission: ${error.message}`, 'Close', {
            duration: 5000
          });
          return of(null);
        }),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Permission updated successfully', 'Close', {
            duration: 3000
          });
        }
      });
  }

  removeUserPermission(permissionId: number): void {
    if (!this.selectedUser) return;
    
    this.saving = true;
    this.permissionsService.removeUserPermission(this.selectedUser.id, permissionId)
      .pipe(
        catchError(error => {
          this.snackBar.open(`Error removing permission override: ${error.message}`, 'Close', {
            duration: 5000
          });
          return of(null);
        }),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Permission override removed', 'Close', {
            duration: 3000
          });
          // Reload permissions to show updated state
          this.loadUserPermissions(this.selectedUser.id);
        }
      });
  }

  getPermissionStatus(permission: any): 'granted' | 'denied' | 'inherited' {
    if (permission.userOverride === undefined) {
      return 'inherited';
    }
    return permission.userOverride ? 'granted' : 'denied';
  }

  /**
   * Gère le changement de statut d'une permission
   */
  onPermissionStatusChange(event: any, permissionId: number): void {
    const value = event.value;
    if (value === 'inherited') {
      this.removeUserPermission(permissionId);
    } else {
      this.updateUserPermission(permissionId, value === 'granted');
    }
  }
}
