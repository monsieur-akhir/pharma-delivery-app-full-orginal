import { Component, OnInit, Input, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from '../../../shared/models/user.model';
import { UserService } from '../../../core/services/api/user.service';
import { PharmacyService } from '../../../core/services/api/pharmacy.service';
import { Subscription } from 'rxjs';
import { PharmacyUserDialogComponent } from './pharmacy-user-dialog/pharmacy-user-dialog.component';

@Component({
  selector: 'app-pharmacy-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="pharmacy-users-container">
      <div class="pharmacy-users-header">
        <h2>Utilisateurs de la pharmacie</h2>
        <button mat-raised-button color="primary" (click)="openCreateUserDialog()">
          <mat-icon>add</mat-icon> Nouvel Utilisateur
        </button>
      </div>
      
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <div class="table-container" *ngIf="!isLoading">
        <table mat-table [dataSource]="dataSource" matSort *ngIf="dataSource.data.length > 0">
          
          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nom</th>
            <td mat-cell *matCellDef="let user">{{user.firstName}} {{user.lastName}}</td>
          </ng-container>
          
          <!-- Email Column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
            <td mat-cell *matCellDef="let user">{{user.email}}</td>
          </ng-container>
          
          <!-- Phone Column -->
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Téléphone</th>
            <td mat-cell *matCellDef="let user">{{user.phone || 'Non renseigné'}}</td>
          </ng-container>
          
          <!-- Role Column -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Rôle</th>
            <td mat-cell *matCellDef="let user">
              <span [ngClass]="getRoleClass(user.role)">
                {{getRoleName(user.role)}}
              </span>
            </td>
          </ng-container>
          
          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Statut</th>
            <td mat-cell *matCellDef="let user">
              <span [ngClass]="user.isActive ? 'status-active' : 'status-inactive'">
                {{user.isActive ? 'Actif' : 'Inactif'}}
              </span>
            </td>
          </ng-container>
          
          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions utilisateur">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="editUser(user)">
                  <mat-icon>edit</mat-icon>
                  <span>Modifier</span>
                </button>
                <button mat-menu-item (click)="toggleUserStatus(user)">
                  <mat-icon>{{ user.isActive ? 'block' : 'check_circle' }}</mat-icon>
                  <span>{{ user.isActive ? 'Désactiver' : 'Activer' }}</span>
                </button>
                <button mat-menu-item (click)="resetPassword(user)">
                  <mat-icon>lock_reset</mat-icon>
                  <span>Réinitialiser le mot de passe</span>
                </button>
                <button mat-menu-item (click)="deleteUser(user)" class="delete-action">
                  <mat-icon color="warn">delete</mat-icon>
                  <span>Supprimer</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>
          
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <div class="no-data-message" *ngIf="!isLoading && dataSource.data.length === 0">
          <p>Aucun utilisateur trouvé pour cette pharmacie</p>
          <button mat-raised-button color="primary" (click)="openCreateUserDialog()">
            Ajouter un utilisateur
          </button>
        </div>
        
        <mat-paginator
          [pageSize]="pageSize"
          [pageSizeOptions]="[5, 10, 25, 50]"
          [length]="totalUsers"
          (page)="onPageChange($event)"
          *ngIf="dataSource.data.length > 0">
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .pharmacy-users-container {
      margin-top: 20px;
    }
    
    .pharmacy-users-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      margin: 40px 0;
    }
    
    .table-container {
      overflow-x: auto;
      margin-bottom: 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    table {
      width: 100%;
    }
    
    .no-data-message {
      text-align: center;
      padding: 30px 0;
    }
    
    .no-data-message p {
      margin-bottom: 15px;
      color: #666;
    }
    
    .role-admin {
      color: #3f51b5;
      font-weight: bold;
    }
    
    .role-pharmacist {
      color: #2196f3;
      font-weight: bold;
    }
    
    .role-pharmacy-admin {
      color: #673ab7;
      font-weight: bold;
    }
    
    .role-staff {
      color: #009688;
    }
    
    .role-delivery {
      color: #ff9800;
    }
    
    .status-active {
      color: #4caf50;
      font-weight: bold;
    }
    
    .status-inactive {
      color: #f44336;
      font-weight: bold;
    }
    
    .delete-action {
      color: #f44336;
    }
    
    @media (max-width: 768px) {
      .pharmacy-users-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }
  `]
})
export class PharmacyUsersComponent implements OnInit, OnDestroy {
  @Input() pharmacyId!: number;
  
  displayedColumns: string[] = ['name', 'email', 'phone', 'role', 'status', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  isLoading = false;
  pageSize = 10;
  pageIndex = 0;
  totalUsers = 0;
  
  private subscription = new Subscription();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private userService: UserService,
    private pharmacyService: PharmacyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    if (this.pharmacyId) {
      this.loadPharmacyUsers();
    }
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  loadPharmacyUsers(): void {
    this.isLoading = true;
    
    const sub = this.userService.getUsersByPharmacy(this.pharmacyId, this.pageIndex + 1, this.pageSize).subscribe({
      next: (response) => {
        this.dataSource.data = response.users;
        this.totalUsers = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading pharmacy users:', error);
        this.snackBar.open('Erreur lors du chargement des utilisateurs', 'Fermer', {
          duration: 3000
        });
      }
    });
    
    this.subscription.add(sub);
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPharmacyUsers();
  }
  
  getRoleName(role: string): string {
    const roleMap: Record<string, string> = {
      'ADMIN': 'Admin',
      'PHARMACY_ADMIN': 'Admin Pharmacie',
      'PHARMACIST': 'Pharmacien',
      'PHARMACY_STAFF': 'Personnel',
      'DELIVERY_PERSON': 'Livreur',
      'USER': 'Client'
    };
    
    return roleMap[role] || role;
  }
  
  getRoleClass(role: string): string {
    const classMap: Record<string, string> = {
      'ADMIN': 'role-admin',
      'PHARMACY_ADMIN': 'role-pharmacy-admin',
      'PHARMACIST': 'role-pharmacist',
      'PHARMACY_STAFF': 'role-staff',
      'DELIVERY_PERSON': 'role-delivery'
    };
    
    return classMap[role] || '';
  }
  
  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(PharmacyUserDialogComponent, {
      width: '600px',
      data: { pharmacyId: this.pharmacyId }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPharmacyUsers();
      }
    });
  }
  
  editUser(user: User): void {
    const dialogRef = this.dialog.open(PharmacyUserDialogComponent, {
      width: '600px',
      data: { user, pharmacyId: this.pharmacyId }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPharmacyUsers();
      }
    });
  }
    toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activer' : 'désactiver';
    
    if (confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) {
      this.isLoading = true;
      
      // Use a separate API call for status change instead of passing isActive directly
      const sub = (newStatus ? this.userService.activateUser(Number(user.id)) : this.userService.suspendUser(Number(user.id))).subscribe({
        next: () => {
          this.snackBar.open(`Utilisateur ${action} avec succès`, 'Fermer', {
            duration: 3000
          });
          this.loadPharmacyUsers();
        },
        error: (error) => {
          this.isLoading = false;
          console.error(`Error ${action} user:`, error);
          this.snackBar.open(`Erreur lors de la tentative de ${action} l'utilisateur`, 'Fermer', {
            duration: 5000
          });
        }
      });
      
      this.subscription.add(sub);
    }
  }
  
  resetPassword(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ?`)) {
      this.isLoading = true;
      
      const sub = this.userService.resetUserPassword(Number(user.id)).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open(response.message || 'Mot de passe réinitialisé avec succès', 'Fermer', {
            duration: 5000
          });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error resetting password:', error);
          this.snackBar.open('Erreur lors de la réinitialisation du mot de passe', 'Fermer', {
            duration: 5000
          });
        }
      });
      
      this.subscription.add(sub);
    }
  }
  
  deleteUser(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.`)) {
      this.isLoading = true;
      
      const sub = this.userService.deleteUser(Number(user.id)).subscribe({
        next: () => {
          this.snackBar.open('Utilisateur supprimé avec succès', 'Fermer', {
            duration: 3000
          });
          this.loadPharmacyUsers();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error deleting user:', error);
          this.snackBar.open('Erreur lors de la suppression de l\'utilisateur', 'Fermer', {
            duration: 5000
          });
        }
      });
      
      this.subscription.add(sub);
    }
  }
}
