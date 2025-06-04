import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, Sort, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/services/api/user.service';
import { User } from '../../shared/models/user.model';
import { UserCreateDialogComponent } from './user-create-dialog/user-create-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="users-container">
      <div class="users-header">
        <h1 class="page-title">Gestion des Utilisateurs</h1>
        <button mat-raised-button color="primary" (click)="openCreateUserDialog()">
          <mat-icon>add</mat-icon> Nouvel Utilisateur
        </button>
      </div>
      
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-form">
            <div class="filter-field">
              <label>Filtrer par rôle:</label>
              <div class="filter-chips">
                <mat-chip-listbox aria-label="Role selection" (change)="onRoleFilterChange($event)">
                  <mat-chip-option color="primary" selected value="Tous">Tous</mat-chip-option>
                  <mat-chip-option value="ADMIN">Administrateur</mat-chip-option>
                  <mat-chip-option value="PHARMACIST">Pharmacien</mat-chip-option>
                  <mat-chip-option value="DELIVERY_PERSON">Livreur</mat-chip-option>
                  <mat-chip-option value="CUSTOMER">Client</mat-chip-option>
                </mat-chip-listbox>
              </div>
            </div>
            <div class="filter-field">
              <label>Statut:</label>
              <div class="filter-chips">
                <mat-chip-listbox aria-label="Status selection" (change)="onStatusFilterChange($event)">
                  <mat-chip-option color="primary" selected value="Tous">Tous</mat-chip-option>
                  <mat-chip-option color="accent" value="active">Actif</mat-chip-option>
                  <mat-chip-option color="warn" value="inactive">Inactif</mat-chip-option>
                </mat-chip-listbox>
              </div>
            </div>
            <div class="search-field">
              <input type="text" placeholder="Rechercher un utilisateur..." [(ngModel)]="searchQuery" (keyup.enter)="onSearch()">
              <button mat-icon-button color="primary" (click)="onSearch()">
                <mat-icon>search</mat-icon>
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <mat-card class="users-table-card">
        <mat-card-content>
          <div class="loading-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        
          <div class="no-results" *ngIf="users.length === 0 && !isLoading">
            Aucun utilisateur trouvé
          </div>

          <table mat-table [dataSource]="users" class="users-table" matSort *ngIf="users.length > 0 && !isLoading">
            <ng-container matColumnDef="avatar">
              <th mat-header-cell *matHeaderCellDef>Avatar</th>
              <td mat-cell *matCellDef="let user">
                <div class="user-avatar" [style.backgroundColor]="user.avatarColor">
                  {{ user.initials }}
                </div>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Nom</th>
              <td mat-cell *matCellDef="let user">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-email">{{ user.email }}</div>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Rôle</th>
              <td mat-cell *matCellDef="let user">
                <span class="role-badge" [ngClass]="'role-' + user.roleClass">
                  {{ user.role }}
                </span>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Statut</th>
              <td mat-cell *matCellDef="let user">
                <span class="status-badge" [ngClass]="'status-' + user.statusClass">
                  {{ user.status }}
                </span>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="lastLogin">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Dernière Connexion</th>
              <td mat-cell *matCellDef="let user">{{ user.lastLogin }}</td>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button [matMenuTriggerFor]="userMenu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #userMenu="matMenu">
                  <button mat-menu-item (click)="editUser(user)">
                    <mat-icon>edit</mat-icon>
                    <span>Modifier</span>
                  </button>
                  <button mat-menu-item (click)="resetPassword(user)">
                    <mat-icon>lock</mat-icon>
                    <span>Réinitialiser mot de passe</span>
                  </button>
                  <button mat-menu-item [disabled]="user.status === 'Inactif'" (click)="deactivateUser(user)">
                    <mat-icon>block</mat-icon>
                    <span>Désactiver</span>
                  </button>
                  <button mat-menu-item [disabled]="user.status === 'Actif'" (click)="activateUser(user)">
                    <mat-icon>check_circle</mat-icon>
                    <span>Activer</span>
                  </button>
                  <button mat-menu-item class="danger-item" (click)="deleteUser(user)">
                    <mat-icon>delete</mat-icon>
                    <span>Supprimer</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          
          <mat-paginator 
            [pageSize]="pageSize" 
            [pageSizeOptions]="[5, 10, 25, 100]"
            [length]="totalUsers"
            (page)="onPageChange($event)"
            *ngIf="users.length > 0">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 20px;
    }
    
    .users-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .page-title {
      margin: 0;
      color: #333;
      font-weight: 500;
    }
    
    .filter-card {
      margin-bottom: 20px;
      border-radius: 8px;
    }
    
    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }
    
    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .filter-field label {
      font-weight: 500;
      color: #555;
    }
    
    .search-field {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .search-field input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .users-table-card {
      border-radius: 8px;
    }
    
    .users-table {
      width: 100%;
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 500;
    }
    
    .user-name {
      font-weight: 500;
      color: #333;
    }
    
    .user-email {
      font-size: 12px;
      color: #777;
    }
    
    .role-badge, .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .role-admin {
      background-color: #e1f5fe;
      color: #0288d1;
    }
    
    .role-pharmacist {
      background-color: #e8f5e9;
      color: #388e3c;
    }
    
    .role-driver {
      background-color: #fff8e1;
      color: #ffa000;
    }
    
    .role-patient {
      background-color: #f3e5f5;
      color: #8e24aa;
    }
    
    .status-active {
      background-color: #e8f5e9;
      color: #388e3c;
    }
    
    .status-inactive {
      background-color: #ffebee;
      color: #d32f2f;
    }
    
    .danger-item {
      color: #f44336;
    }
    
    @media (max-width: 768px) {
      .users-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      
      .filter-form {
        flex-direction: column;
      }
    }
  `]
})
export class UsersComponent implements OnInit {
  displayedColumns: string[] = ['avatar', 'name', 'role', 'status', 'lastLogin', 'actions'];
  
  users: any[] = [];
  filteredUsers: any[] = [];
  isLoading = false;
  totalUsers = 0;
  page = 0;
  pageSize = 10;
  selectedRole: string | null = null;
  selectedStatus: string | null = null;
  searchQuery = '';

  @ViewChild(MatPaginator) paginator: any;
  @ViewChild(MatSort) sort: any;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }
  
  loadUsers(): void {
    this.isLoading = true;
    
    // Prepare filter parameters
    const role = this.selectedRole === 'Tous' ? undefined : this.selectedRole || undefined;
    const status = this.selectedStatus === 'Tous' ? undefined : this.selectedStatus || undefined;
    
    this.userService.getUsers(this.page + 1, this.pageSize, role, status).subscribe({
      next: (response) => {
        // Utilisation des données simulées temporairement jusqu'à ce que l'API soit correctement typée
        this.users = response.users.map((user: any) => this.formatUserData(user));
        this.totalUsers = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users', error);
        this.snackBar.open('Erreur lors du chargement des utilisateurs', 'Fermer', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.isLoading = false;
      }
    });
  }
  
  formatUserData(user: any): any {
    // Map API user model to component display model
    const formattedUser = {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      email: user.email || user.phone,
      role: this.mapRole(user.role),
      roleClass: this.mapRoleClass(user.role),
      status: user.isActive ? 'Actif' : 'Inactif',
      statusClass: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin ? this.formatDate(user.lastLogin) : 'Jamais',
      initials: this.getInitials(`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username),
      avatarColor: this.getAvatarColor(user.id)
    };
    
    return formattedUser;
  }
  
  mapRole(role: string): string {
    const roleMap: {[key: string]: string} = {
      'ADMIN': 'Administrateur',
      'SUPER_ADMIN': 'Super Admin',
      'PHARMACY_STAFF': 'Personnel Pharmacie',
      'PHARMACIST': 'Pharmacien',
      'DELIVERY_PERSON': 'Livreur',
      'CUSTOMER': 'Client',
      'MANAGER': 'Manager',
      'SUPPORT': 'Support',
      'VIEWER': 'Spectateur'
    };
    
    return roleMap[role] || role;
  }
  
  mapRoleClass(role: string): string {
    const roleClassMap: {[key: string]: string} = {
      'ADMIN': 'admin',
      'SUPER_ADMIN': 'admin',
      'PHARMACY_STAFF': 'pharmacist',
      'PHARMACIST': 'pharmacist',
      'DELIVERY_PERSON': 'driver',
      'CUSTOMER': 'patient',
      'MANAGER': 'admin',
      'SUPPORT': 'support',
      'VIEWER': 'viewer'
    };
    
    return roleClassMap[role] || 'default';
  }
  
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  getAvatarColor(id: string): string {
    const colors = [
      '#0288d1', // blue
      '#388e3c', // green
      '#f57c00', // orange
      '#d32f2f', // red
      '#7b1fa2', // purple
      '#c2185b', // pink
      '#00796b', // teal
      '#fbc02d'  // yellow
    ];
    
    const colorIndex = parseInt(id) % colors.length;
    return colors[colorIndex];
  }
  
  formatDate(date: Date | string): string {
    const dateObj = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Aujourd'hui à ${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffDays === 1) {
      return `Hier à ${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else if (diffDays < 30) {
      return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
    } else {
      return `Il y a ${Math.floor(diffDays / 30)} mois`;
    }
  }

  onRoleFilterChange(event: MatChipListboxChange): void {
    this.selectedRole = event.value;
    this.page = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadUsers();
  }

  onStatusFilterChange(event: MatChipListboxChange): void {
    this.selectedStatus = event.value;
    this.page = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadUsers();
  }

  onSearch(): void {
    this.page = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(UserCreateDialogComponent, {
      width: '700px'
    });
    
    dialogRef.afterClosed().subscribe(newUser => {
      if (newUser) {
        // Refresh the user list
        this.loadUsers();
      }
    });
  }

  editUser(user: any): void {
    // A implémenter avec un MatDialog pour éditer un utilisateur
    this.snackBar.open(`Modification de l'utilisateur ${user.name}`, 'Fermer', {
      duration: 3000
    });
  }

  resetPassword(user: any): void {
    if (confirm(`Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.name} ?`)) {
      this.userService.resetUserPassword(Number(user.id)).subscribe({
        next: (response) => {
          this.snackBar.open('Mot de passe réinitialisé avec succès', 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error resetting password', error);
          this.snackBar.open('Erreur lors de la réinitialisation du mot de passe', 'Fermer', {
            duration: 3000,
            panelClass: 'error-snackbar'
          });
        }
      });
    }
  }

  deactivateUser(user: any): void {
    if (confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur ${user.name} ?`)) {
      this.userService.suspendUser(Number(user.id)).subscribe({
        next: (response) => {
          user.status = 'Inactif';
          user.statusClass = 'inactive';
          this.snackBar.open('Utilisateur désactivé avec succès', 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error deactivating user', error);
          this.snackBar.open('Erreur lors de la désactivation de l\'utilisateur', 'Fermer', {
            duration: 3000,
            panelClass: 'error-snackbar'
          });
        }
      });
    }
  }

  activateUser(user: any): void {
    if (confirm(`Êtes-vous sûr de vouloir activer l'utilisateur ${user.name} ?`)) {
      this.userService.activateUser(Number(user.id)).subscribe({
        next: (response) => {
          user.status = 'Actif';
          user.statusClass = 'active';
          this.snackBar.open('Utilisateur activé avec succès', 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error activating user', error);
          this.snackBar.open('Erreur lors de l\'activation de l\'utilisateur', 'Fermer', {
            duration: 3000,
            panelClass: 'error-snackbar'
          });
        }
      });
    }
  }

  deleteUser(user: any): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${user.name} ? Cette action est irréversible.`)) {
      this.userService.deleteUser(Number(user.id)).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.snackBar.open('Utilisateur supprimé avec succès', 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error deleting user', error);
          this.snackBar.open('Erreur lors de la suppression de l\'utilisateur', 'Fermer', {
            duration: 3000,
            panelClass: 'error-snackbar'
          });
        }
      });
    }
  }
}