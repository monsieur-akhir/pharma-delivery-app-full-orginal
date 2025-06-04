import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { UsersService } from '../users.service';
import { UserListItem, UserRole, UserStatus } from '../../../core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { UserRoleDialogComponent } from '../user-roles/user-role-dialog.component';
import { startWith, map } from 'rxjs/operators';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'fullName', 'username', 'email', 'role', 'status', 'createdAt', 'lastLoginAt', 'actions'];
  dataSource = new MatTableDataSource<UserListItem>([]);
  
  roleFilter = new FormControl('');
  roleOptions = Object.values(UserRole);
  filteredRoleOptions: Observable<string[]>;
  
  statusFilter = new FormControl('');
  statusOptions = Object.values(UserStatus);
  filteredStatusOptions: Observable<string[]>;
  
  searchQuery = '';
  totalUsers = 0;
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usersService: UsersService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filteredRoleOptions = this.roleFilter.valueChanges.pipe(
      startWith(''),
      map(value => this._filterRole(value || ''))
    );
    
    this.filteredStatusOptions = this.statusFilter.valueChanges.pipe(
      startWith(''),
      map(value => this._filterStatus(value || ''))
    );
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(role?: UserRole, status?: UserStatus) {
    this.isLoading = true;
    this.error = null;
    
    this.usersService.getUsers(
      this.paginator?.pageIndex || 0, 
      this.paginator?.pageSize || 10,
      role,
      status,
      this.searchQuery
    ).subscribe(
      response => {
        this.dataSource.data = response.data;
        this.totalUsers = response.total;
        this.isLoading = false;
      },
      error => {
        console.error('Error loading users', error);
        this.error = 'Impossible de charger les utilisateurs. Veuillez réessayer.';
        this.isLoading = false;
      }
    );
  }

  applyFilter() {
    this.paginator.firstPage();
    this.loadUsers(
      this.roleFilter.value as UserRole, 
      this.statusFilter.value as UserStatus
    );
  }

  clearFilters() {
    this.roleFilter.setValue('');
    this.statusFilter.setValue('');
    this.searchQuery = '';
    this.paginator.firstPage();
    this.loadUsers();
  }

  onSearch() {
    this.paginator.firstPage();
    this.loadUsers(
      this.roleFilter.value as UserRole, 
      this.statusFilter.value as UserStatus
    );
  }

  viewUser(id: number) {
    this.router.navigate(['/users', id]);
  }

  editUser(id: number) {
    this.router.navigate(['/users', id, 'edit']);
  }

  updateUserRole(id: number, role: UserRole) {
    this.usersService.updateUserRole(id, role).subscribe(
      response => {
        this.snackBar.open(`Rôle de l'utilisateur mis à jour: ${role}`, 'Fermer', {
          duration: 3000
        });
        this.loadUsers(
          this.roleFilter.value as UserRole, 
          this.statusFilter.value as UserStatus
        );
      },
      error => {
        console.error('Error updating user role', error);
        this.snackBar.open('Impossible de mettre à jour le rôle. Veuillez réessayer.', 'Fermer', {
          duration: 3000
        });
      }
    );
  }

  disableUser(id: number) {
    this.usersService.disableUser(id).subscribe(
      response => {
        this.snackBar.open('Utilisateur désactivé avec succès', 'Fermer', {
          duration: 3000
        });
        this.loadUsers(
          this.roleFilter.value as UserRole, 
          this.statusFilter.value as UserStatus
        );
      },
      error => {
        console.error('Error disabling user', error);
        this.snackBar.open('Impossible de désactiver l\'utilisateur. Veuillez réessayer.', 'Fermer', {
          duration: 3000
        });
      }
    );
  }

  enableUser(id: number) {
    this.usersService.enableUser(id).subscribe(
      response => {
        this.snackBar.open('Utilisateur activé avec succès', 'Fermer', {
          duration: 3000
        });
        this.loadUsers(
          this.roleFilter.value as UserRole, 
          this.statusFilter.value as UserStatus
        );
      },
      error => {
        console.error('Error enabling user', error);
        this.snackBar.open('Impossible d\'activer l\'utilisateur. Veuillez réessayer.', 'Fermer', {
          duration: 3000
        });
      }
    );
  }

  openRoleDialog(user: UserListItem): void {
    const dialogRef = this.dialog.open(UserRoleDialogComponent, {
      width: '500px',
      data: {
        userId: user.id,
        username: user.username,
        currentRole: user.role
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result !== user.role) {
        this.updateUserRole(user.id, result);
      }
    });
  }

  getStatusClass(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'status-active';
      case UserStatus.INACTIVE:
        return 'status-inactive';
      case UserStatus.PENDING:
        return 'status-pending';
      case UserStatus.SUSPENDED:
        return 'status-suspended';
      default:
        return '';
    }
  }

  getRoleClass(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'role-admin';
      case UserRole.PHARMACY_OWNER:
        return 'role-owner';
      case UserRole.PHARMACY_STAFF:
        return 'role-staff';
      case UserRole.DELIVERY_PERSON:
        return 'role-delivery';
      case UserRole.CUSTOMER:
        return 'role-customer';
      default:
        return '';
    }
  }

  private _filterRole(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.roleOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterStatus(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.statusOptions.filter(option => option.toLowerCase().includes(filterValue));
  }
}