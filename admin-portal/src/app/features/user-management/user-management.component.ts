import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FuturisticLoaderComponent } from '../../shared/components/futuristic-loader/futuristic-loader.component';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  lastLogin?: Date;
  createdAt: Date;
  phoneNumber?: string;
  permissions?: string[];
  pharmacy?: {
    id: number;
    name: string;
  };
  address?: string;
  avatar?: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
  isSystem: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    FuturisticLoaderComponent
  ],
  template: `
    <div class="user-management-container">
      <!-- Loader overlay when loading -->
      <div class="loader-overlay" *ngIf="isLoading">
        <app-futuristic-loader 
          type="medical" 
          message="Chargement des données utilisateurs..."
          [showProgress]="true"
          [progress]="65">
        </app-futuristic-loader>
      </div>

      <!-- Header section -->
      <div class="page-header">
        <div class="header-title">
          <h1>Gestion des Utilisateurs</h1>
          <p class="subtitle">Gérez les utilisateurs, les rôles et les permissions du système</p>
        </div>
        
        <div class="header-actions">
          <button mat-raised-button color="primary" class="action-button" (click)="showAddUserForm()">
            <mat-icon>person_add</mat-icon>
            Nouvel utilisateur
          </button>
          
          <button mat-raised-button color="accent" class="action-button" (click)="showRoleManager()">
            <mat-icon>admin_panel_settings</mat-icon>
            Gérer les rôles
          </button>
          
          <button mat-icon-button matTooltip="Exporter les utilisateurs" color="primary">
            <mat-icon>file_download</mat-icon>
          </button>
        </div>
      </div>

      <!-- Main content tabs -->
      <mat-tab-group animationDuration="300ms" class="users-tabs" (selectedTabChange)="onTabChange($event)">
        <mat-tab label="Utilisateurs">
          <!-- Users List Tab -->
          <div class="tab-content">
            <!-- Filters and search -->
            <div class="filters-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Rechercher des utilisateurs</mat-label>
                <input matInput placeholder="Nom, email, rôle..." [(ngModel)]="searchTerm">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              
              <div class="filter-fields">
                <mat-form-field appearance="outline">
                  <mat-label>Rôle</mat-label>
                  <mat-select [(ngModel)]="roleFilter">
                    <mat-option value="all">Tous les rôles</mat-option>
                    <mat-option *ngFor="let role of roles" [value]="role.id">{{ role.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <mat-form-field appearance="outline">
                  <mat-label>Statut</mat-label>
                  <mat-select [(ngModel)]="statusFilter">
                    <mat-option value="all">Tous les statuts</mat-option>
                    <mat-option value="active">Actif</mat-option>
                    <mat-option value="inactive">Inactif</mat-option>
                    <mat-option value="pending">En attente</mat-option>
                    <mat-option value="blocked">Bloqué</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <mat-form-field appearance="outline">
                  <mat-label>Pharmacie</mat-label>
                  <mat-select [(ngModel)]="pharmacyFilter">
                    <mat-option value="all">Toutes les pharmacies</mat-option>
                    <mat-option value="1">Pharmacie Centrale</mat-option>
                    <mat-option value="2">Pharmacie Nord</mat-option>
                    <mat-option value="3">Pharmacie Est</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
            
            <!-- Users Table -->
            <div class="table-container">
              <table mat-table [dataSource]="filteredUsers" matSort class="users-table">
                
                <!-- Avatar Column -->
                <ng-container matColumnDef="avatar">
                  <th mat-header-cell *matHeaderCellDef> Avatar </th>
                  <td mat-cell *matCellDef="let user"> 
                    <div class="user-avatar">
                      <div class="avatar-placeholder">
                        <mat-icon *ngIf="!user.avatar">person</mat-icon>
                        <img *ngIf="user.avatar" [src]="user.avatar" alt="User avatar">
                      </div>
                    </div>
                  </td>
                </ng-container>
                
                <!-- Name Column -->
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Nom </th>
                  <td mat-cell *matCellDef="let user"> 
                    <div class="user-name">
                      {{ user.firstName }} {{ user.lastName }}
                      <div class="user-username">@{{ user.username }}</div>
                    </div>
                  </td>
                </ng-container>
                
                <!-- Email Column -->
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Email </th>
                  <td mat-cell *matCellDef="let user"> {{ user.email }} </td>
                </ng-container>
                
                <!-- Role Column -->
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Rôle </th>
                  <td mat-cell *matCellDef="let user"> 
                    <div class="role-badge" [ngClass]="getRoleBadgeClass(user.role)">
                      {{ getRoleLabel(user.role) }}
                    </div>
                  </td>
                </ng-container>
                
                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Statut </th>
                  <td mat-cell *matCellDef="let user"> 
                    <div class="status-indicator" [ngClass]="'status-' + user.status">
                      <span class="status-dot"></span>
                      <span class="status-text">{{ getStatusLabel(user.status) }}</span>
                    </div>
                  </td>
                </ng-container>
                
                <!-- Pharmacy Column -->
                <ng-container matColumnDef="pharmacy">
                  <th mat-header-cell *matHeaderCellDef> Pharmacie </th>
                  <td mat-cell *matCellDef="let user"> 
                    <span *ngIf="user.pharmacy">{{ user.pharmacy.name }}</span>
                    <span *ngIf="!user.pharmacy" class="no-value">Non assigné</span>
                  </td>
                </ng-container>
                
                <!-- Last Login Column -->
                <ng-container matColumnDef="lastLogin">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Dernière connexion </th>
                  <td mat-cell *matCellDef="let user"> 
                    <span *ngIf="user.lastLogin">{{ user.lastLogin | date:'dd/MM/yyyy HH:mm' }}</span>
                    <span *ngIf="!user.lastLogin" class="no-value">Jamais connecté</span>
                  </td>
                </ng-container>
                
                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef> Actions </th>
                  <td mat-cell *matCellDef="let user"> 
                    <div class="action-buttons">
                      <button mat-icon-button color="primary" matTooltip="Modifier" (click)="editUser(user)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Voir détails" (click)="viewUserDetails(user)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button [matMenuTriggerFor]="userMenu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #userMenu="matMenu">
                        <button mat-menu-item (click)="resetPassword(user)">
                          <mat-icon>lock_reset</mat-icon>
                          <span>Réinitialiser mot de passe</span>
                        </button>
                        <button mat-menu-item *ngIf="user.status !== 'blocked'" (click)="blockUser(user)">
                          <mat-icon>block</mat-icon>
                          <span>Bloquer l'utilisateur</span>
                        </button>
                        <button mat-menu-item *ngIf="user.status === 'blocked'" (click)="unblockUser(user)">
                          <mat-icon>check_circle</mat-icon>
                          <span>Débloquer l'utilisateur</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item color="warn" (click)="deleteUser(user)">
                          <mat-icon color="warn">delete</mat-icon>
                          <span class="text-danger">Supprimer</span>
                        </button>
                      </mat-menu>
                    </div>
                  </td>
                </ng-container>
                
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="user-row"></tr>
              </table>
              
              <!-- Empty State -->
              <div class="empty-state" *ngIf="filteredUsers.length === 0">
                <mat-icon>people_outline</mat-icon>
                <h3>Aucun utilisateur trouvé</h3>
                <p>Aucun utilisateur ne correspond à vos critères de recherche</p>
                <button mat-raised-button color="primary" (click)="clearFilters()">Effacer les filtres</button>
              </div>
              
              <!-- Paginator -->
              <mat-paginator 
                [pageSizeOptions]="[10, 25, 50, 100]"
                showFirstLastButtons>
              </mat-paginator>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Rôles & Permissions">
          <!-- Roles and Permissions Tab -->
          <div class="tab-content">
            <div class="roles-permissions-container">
              <!-- Roles List -->
              <div class="roles-list-container">
                <div class="section-header">
                  <h2>Rôles</h2>
                  <button mat-mini-fab color="primary" matTooltip="Ajouter un rôle" (click)="addNewRole()">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
                
                <div class="roles-list">
                  <mat-card *ngFor="let role of roles" 
                            class="role-card"
                            [ngClass]="{'selected': selectedRole?.id === role.id}"
                            (click)="selectRole(role)">
                    <div class="role-card-header">
                      <div class="role-name">{{ role.name }}</div>
                      <div class="role-users-count">{{ role.usersCount }} utilisateurs</div>
                    </div>
                    <div class="role-description">{{ role.description }}</div>
                    <div class="role-permissions">
                      <mat-chip-listbox>
                        <mat-chip *ngFor="let permId of role.permissions.slice(0, 2)">
                          {{ getPermissionName(permId) }}
                        </mat-chip>
                        <mat-chip *ngIf="role.permissions.length > 2">
                          +{{ role.permissions.length - 2 }}
                        </mat-chip>
                      </mat-chip-listbox>
                    </div>
                    <div class="role-actions" *ngIf="!role.isSystem">
                      <button mat-icon-button matTooltip="Modifier" (click)="editRole(role, $event)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Supprimer" color="warn" (click)="deleteRole(role, $event)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                    <div class="system-role-badge" *ngIf="role.isSystem">
                      <mat-icon>security</mat-icon>
                      <span>Système</span>
                    </div>
                  </mat-card>
                </div>
              </div>
              
              <!-- Permissions Detail -->
              <div class="permissions-detail-container">
                <ng-container *ngIf="selectedRole; else selectRolePrompt">
                  <div class="section-header">
                    <h2>Permissions: {{ selectedRole.name }}</h2>
                    <div class="header-actions">
                      <button mat-raised-button color="primary" [disabled]="selectedRole.isSystem" (click)="saveRoleChanges()">
                        <mat-icon>save</mat-icon>
                        Enregistrer
                      </button>
                    </div>
                  </div>
                  
                  <div class="permissions-groups">
                    <div class="permissions-group" *ngFor="let category of permissionCategories">
                      <div class="group-header">
                        <h3>{{ category }}</h3>
                        <mat-slide-toggle 
                          [checked]="isAllCategorySelected(category)" 
                          [disabled]="selectedRole.isSystem"
                          (change)="toggleCategory(category, $event.checked)">
                          Tout sélectionner
                        </mat-slide-toggle>
                      </div>
                      
                      <div class="permissions-list">
                        <div class="permission-item" *ngFor="let permission of getPermissionsByCategory(category)">
                          <mat-checkbox 
                            [checked]="isPermissionSelected(permission.id)" 
                            [disabled]="selectedRole.isSystem"
                            (change)="togglePermission(permission.id, $event.checked)">
                            <div class="permission-info">
                              <div class="permission-name">{{ permission.name }}</div>
                              <div class="permission-description">{{ permission.description }}</div>
                            </div>
                          </mat-checkbox>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>
                
                <ng-template #selectRolePrompt>
                  <div class="select-role-prompt">
                    <mat-icon>admin_panel_settings</mat-icon>
                    <h3>Sélectionnez un rôle</h3>
                    <p>Veuillez sélectionner un rôle dans la liste pour voir et gérer ses permissions.</p>
                  </div>
                </ng-template>
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Activité & Audit">
          <!-- Activity and Audit Log Tab -->
          <div class="tab-content">
            <div class="activity-filters">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Rechercher dans les logs</mat-label>
                <input matInput placeholder="Utilisateur, action, IP...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              
              <div class="filter-fields">
                <mat-form-field appearance="outline">
                  <mat-label>Type d'action</mat-label>
                  <mat-select>
                    <mat-option value="all">Toutes les actions</mat-option>
                    <mat-option value="login">Connexion</mat-option>
                    <mat-option value="logout">Déconnexion</mat-option>
                    <mat-option value="create">Création</mat-option>
                    <mat-option value="update">Modification</mat-option>
                    <mat-option value="delete">Suppression</mat-option>
                    <mat-option value="permission">Changement de permissions</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <mat-form-field appearance="outline">
                  <mat-label>Période</mat-label>
                  <mat-select>
                    <mat-option value="today">Aujourd'hui</mat-option>
                    <mat-option value="yesterday">Hier</mat-option>
                    <mat-option value="week">Cette semaine</mat-option>
                    <mat-option value="month">Ce mois</mat-option>
                    <mat-option value="custom">Personnalisé</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <button mat-raised-button color="primary">
                  <mat-icon>filter_alt</mat-icon>
                  Filtrer
                </button>
              </div>
            </div>
            
            <!-- Activity Timeline -->
            <div class="activity-timeline">
              <div class="timeline-header">
                <h2>Journal d'activité</h2>
                <div class="header-actions">
                  <button mat-button color="primary">
                    <mat-icon>file_download</mat-icon>
                    Exporter
                  </button>
                  <button mat-icon-button matTooltip="Actualiser">
                    <mat-icon>refresh</mat-icon>
                  </button>
                </div>
              </div>
              
              <div class="timeline-container">
                <!-- Today Group -->
                <div class="timeline-group">
                  <div class="timeline-day">Aujourd'hui</div>
                  
                  <div class="timeline-item">
                    <div class="timeline-icon login">
                      <mat-icon>login</mat-icon>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="user-name">Sophie Mercier</span>
                        <span class="action-type">s'est connectée</span>
                      </div>
                      <div class="timeline-time">11:42</div>
                      <div class="timeline-details">
                        <div class="detail-item">
                          <span class="detail-label">IP:</span>
                          <span class="detail-value">192.168.1.45</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Navigateur:</span>
                          <span class="detail-value">Chrome 112.0.5615.121</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="timeline-item">
                    <div class="timeline-icon update">
                      <mat-icon>edit</mat-icon>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="user-name">Admin</span>
                        <span class="action-type">a modifié un utilisateur</span>
                      </div>
                      <div class="timeline-time">10:15</div>
                      <div class="timeline-details">
                        <div class="detail-item">
                          <span class="detail-label">Utilisateur:</span>
                          <span class="detail-value">Thomas Leroy</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Changements:</span>
                          <span class="detail-value">Rôle Pharmacien → Admin Pharmacie</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="timeline-item">
                    <div class="timeline-icon create">
                      <mat-icon>person_add</mat-icon>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="user-name">Admin</span>
                        <span class="action-type">a créé un nouvel utilisateur</span>
                      </div>
                      <div class="timeline-time">09:32</div>
                      <div class="timeline-details">
                        <div class="detail-item">
                          <span class="detail-label">Nouvel utilisateur:</span>
                          <span class="detail-value">Marie Dubois</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Rôle:</span>
                          <span class="detail-value">Pharmacien</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Yesterday Group -->
                <div class="timeline-group">
                  <div class="timeline-day">Hier</div>
                  
                  <div class="timeline-item">
                    <div class="timeline-icon permission">
                      <mat-icon>security</mat-icon>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="user-name">Admin</span>
                        <span class="action-type">a modifié des permissions</span>
                      </div>
                      <div class="timeline-time">16:20</div>
                      <div class="timeline-details">
                        <div class="detail-item">
                          <span class="detail-label">Rôle:</span>
                          <span class="detail-value">Livreur</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Changements:</span>
                          <span class="detail-value">+2 permissions, -1 permission</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="timeline-item">
                    <div class="timeline-icon delete">
                      <mat-icon>delete</mat-icon>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="user-name">Sophie Mercier</span>
                        <span class="action-type">a supprimé un utilisateur</span>
                      </div>
                      <div class="timeline-time">15:05</div>
                      <div class="timeline-details">
                        <div class="detail-item">
                          <span class="detail-label">Utilisateur:</span>
                          <span class="detail-value">Jean Martin</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Raison:</span>
                          <span class="detail-value">Compte en double</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="load-more">
                  <button mat-button color="primary">
                    <mat-icon>expand_more</mat-icon>
                    Charger plus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
      
      <!-- User Form Dialog -->
      <div class="form-overlay" *ngIf="showingUserForm">
        <mat-card class="form-dialog">
          <mat-card-header>
            <mat-card-title>{{ isEditMode ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}</mat-card-title>
            <button mat-icon-button (click)="cancelUserForm()" class="close-button">
              <mat-icon>close</mat-icon>
            </button>
          </mat-card-header>
          
          <mat-card-content>
            <form [formGroup]="userForm" class="user-form">
              <!-- Basic Information -->
              <div class="form-section">
                <h3>Informations de base</h3>
                
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Prénom</mat-label>
                    <input matInput formControlName="firstName" required>
                    <mat-error *ngIf="userForm.get('firstName')?.hasError('required')">
                      Le prénom est requis
                    </mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Nom</mat-label>
                    <input matInput formControlName="lastName" required>
                    <mat-error *ngIf="userForm.get('lastName')?.hasError('required')">
                      Le nom est requis
                    </mat-error>
                  </mat-form-field>
                </div>
                
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Nom d'utilisateur</mat-label>
                    <input matInput formControlName="username" required>
                    <mat-error *ngIf="userForm.get('username')?.hasError('required')">
                      Le nom d'utilisateur est requis
                    </mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email" required type="email">
                    <mat-error *ngIf="userForm.get('email')?.hasError('required')">
                      L'email est requis
                    </mat-error>
                    <mat-error *ngIf="userForm.get('email')?.hasError('email')">
                      Veuillez entrer un email valide
                    </mat-error>
                  </mat-form-field>
                </div>
                
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Téléphone</mat-label>
                    <input matInput formControlName="phoneNumber">
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Adresse</mat-label>
                    <input matInput formControlName="address">
                  </mat-form-field>
                </div>
              </div>
              
              <!-- Account Settings -->
              <div class="form-section">
                <h3>Paramètres du compte</h3>
                
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Rôle</mat-label>
                    <mat-select formControlName="role" required>
                      <mat-option *ngFor="let role of roles" [value]="role.id">
                        {{ role.name }}
                      </mat-option>
                    </mat-select>
                    <mat-error *ngIf="userForm.get('role')?.hasError('required')">
                      Le rôle est requis
                    </mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Statut</mat-label>
                    <mat-select formControlName="status" required>
                      <mat-option value="active">Actif</mat-option>
                      <mat-option value="inactive">Inactif</mat-option>
                      <mat-option value="pending">En attente</mat-option>
                      <mat-option value="blocked">Bloqué</mat-option>
                    </mat-select>
                    <mat-error *ngIf="userForm.get('status')?.hasError('required')">
                      Le statut est requis
                    </mat-error>
                  </mat-form-field>
                </div>
                
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Pharmacie</mat-label>
                    <mat-select formControlName="pharmacyId">
                      <mat-option [value]="null">Non assigné</mat-option>
                      <mat-option value="1">Pharmacie Centrale</mat-option>
                      <mat-option value="2">Pharmacie Nord</mat-option>
                      <mat-option value="3">Pharmacie Est</mat-option>
                    </mat-select>
                  </mat-form-field>
                  
                  <div class="form-field password-field" *ngIf="!isEditMode">
                    <mat-slide-toggle formControlName="sendPasswordEmail">
                      Envoyer un email avec le mot de passe
                    </mat-slide-toggle>
                  </div>
                </div>
              </div>
            </form>
          </mat-card-content>
          
          <mat-divider></mat-divider>
          
          <mat-card-actions align="end">
            <button mat-button (click)="cancelUserForm()">Annuler</button>
            <button mat-raised-button color="primary" [disabled]="!userForm.valid" (click)="saveUser()">
              {{ isEditMode ? 'Mettre à jour' : 'Créer' }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .user-management-container {
      width: 100%;
      max-width: 1600px;
      margin: 0 auto;
      padding: 20px;
      position: relative;
    }
    
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(var(--background-primary-rgb), 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 20px;
    }
    
    .header-title h1 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 500;
      color: var(--text-primary);
      position: relative;
      display: inline-block;
    }
    
    .header-title h1::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -8px;
      height: 3px;
      width: 60px;
      background: linear-gradient(90deg, var(--accent-color), transparent);
      border-radius: 3px;
    }
    
    .subtitle {
      color: var(--text-secondary);
      margin: 0;
    }
    
    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .action-button {
      border-radius: 20px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    }
    
    .action-button mat-icon {
      margin-right: 8px;
    }
    
    .users-tabs {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
    }
    
    .tab-content {
      padding: 20px;
    }
    
    .filters-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
      gap: 16px;
    }
    
    .search-field {
      width: 100%;
    }
    
    .filter-fields {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .filter-fields mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    .users-table {
      width: 100%;
    }
    
    .user-row {
      height: 72px;
      background-color: rgba(var(--background-secondary-rgb), 0.5);
      transition: all 0.2s ease;
    }
    
    .user-row:hover {
      background-color: rgba(var(--hover-bg-rgb), 0.2);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px var(--shadow-color);
    }
    
    .mat-header-cell {
      color: var(--text-secondary);
      font-weight: 500;
      font-size: 14px;
      padding: 0 16px;
    }
    
    .mat-cell {
      color: var(--text-primary);
      padding: 0 16px;
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
    }
    
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background-color: rgba(var(--accent-color-rgb), 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .avatar-placeholder mat-icon {
      color: var(--accent-color);
    }
    
    .user-name {
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .user-username {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .role-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .role-admin {
      background-color: rgba(156, 39, 176, 0.1);
      color: #9C27B0;
    }
    
    .role-pharmacist {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }
    
    .role-delivery {
      background-color: rgba(33, 150, 243, 0.1);
      color: #2196F3;
    }
    
    .role-customer {
      background-color: rgba(255, 152, 0, 0.1);
      color: #FF9800;
    }
    
    .role-pharmacy-admin {
      background-color: rgba(0, 188, 212, 0.1);
      color: #00BCD4;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    .status-active .status-dot {
      background-color: #4CAF50;
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
    }
    
    .status-inactive .status-dot {
      background-color: #9E9E9E;
    }
    
    .status-pending .status-dot {
      background-color: #FFC107;
      box-shadow: 0 0 8px rgba(255, 193, 7, 0.6);
    }
    
    .status-blocked .status-dot {
      background-color: #F44336;
      box-shadow: 0 0 8px rgba(244, 67, 54, 0.6);
    }
    
    .status-active .status-text {
      color: #4CAF50;
    }
    
    .status-inactive .status-text {
      color: #9E9E9E;
    }
    
    .status-pending .status-text {
      color: #FFC107;
    }
    
    .status-blocked .status-text {
      color: #F44336;
    }
    
    .no-value {
      color: var(--text-muted);
      font-style: italic;
    }
    
    .action-buttons {
      display: flex;
      gap: 4px;
    }
    
    .text-danger {
      color: #F44336;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }
    
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--text-secondary);
      margin-bottom: 20px;
      opacity: 0.6;
    }
    
    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 20px;
      color: var(--text-primary);
    }
    
    .empty-state p {
      margin: 0 0 20px;
      color: var(--text-secondary);
    }
    
    /* Roles and Permissions Tab */
    .roles-permissions-container {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 20px;
      height: 600px;
    }
    
    .roles-list-container {
      background-color: rgba(var(--background-secondary-rgb), 0.5);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      padding: 16px;
      overflow-y: auto;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .section-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .roles-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .role-card {
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid var(--border-color);
      position: relative;
    }
    
    .role-card:hover {
      background-color: rgba(var(--hover-bg-rgb), 0.2);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px var(--shadow-color);
    }
    
    .role-card.selected {
      border-color: var(--accent-color);
      background-color: rgba(var(--accent-color-rgb), 0.05);
    }
    
    .role-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .role-name {
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .role-users-count {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .role-description {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 10px;
    }
    
    .role-permissions {
      margin-bottom: 12px;
    }
    
    .role-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    
    .system-role-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: rgba(0, 150, 136, 0.1);
      color: #009688;
      font-size: 12px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .system-role-badge mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
    }
    
    .permissions-detail-container {
      background-color: rgba(var(--background-secondary-rgb), 0.5);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      padding: 16px;
      overflow-y: auto;
    }
    
    .permissions-groups {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }
    
    .group-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .permissions-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 12px;
    }
    
    .permission-item {
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .permission-item:hover {
      background-color: rgba(var(--hover-bg-rgb), 0.1);
    }
    
    .permission-info {
      margin-left: 8px;
    }
    
    .permission-name {
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .permission-description {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .select-role-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
    }
    
    .select-role-prompt mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--text-secondary);
      margin-bottom: 20px;
      opacity: 0.6;
    }
    
    .select-role-prompt h3 {
      margin: 0 0 8px;
      font-size: 20px;
      color: var(--text-primary);
    }
    
    .select-role-prompt p {
      margin: 0;
      color: var(--text-secondary);
      max-width: 400px;
    }
    
    /* Activity Tab */
    .activity-filters {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
      gap: 16px;
    }
    
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .timeline-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .timeline-container {
      padding: 16px;
      background-color: rgba(var(--background-secondary-rgb), 0.5);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
    
    .timeline-group {
      margin-bottom: 24px;
    }
    
    .timeline-day {
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .timeline-item {
      display: flex;
      margin-bottom: 16px;
      padding-left: 36px;
      position: relative;
    }
    
    .timeline-item::before {
      content: '';
      position: absolute;
      left: 19px;
      top: 32px;
      bottom: -16px;
      width: 2px;
      background-color: rgba(var(--border-color-rgb), 0.5);
      z-index: 1;
    }
    
    .timeline-group .timeline-item:last-child::before {
      display: none;
    }
    
    .timeline-icon {
      position: absolute;
      left: 0;
      top: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    
    .timeline-icon.login {
      background-color: rgba(76, 175, 80, 0.1);
    }
    
    .timeline-icon.login mat-icon {
      color: #4CAF50;
    }
    
    .timeline-icon.logout {
      background-color: rgba(96, 125, 139, 0.1);
    }
    
    .timeline-icon.logout mat-icon {
      color: #607D8B;
    }
    
    .timeline-icon.create {
      background-color: rgba(33, 150, 243, 0.1);
    }
    
    .timeline-icon.create mat-icon {
      color: #2196F3;
    }
    
    .timeline-icon.update {
      background-color: rgba(255, 152, 0, 0.1);
    }
    
    .timeline-icon.update mat-icon {
      color: #FF9800;
    }
    
    .timeline-icon.delete {
      background-color: rgba(244, 67, 54, 0.1);
    }
    
    .timeline-icon.delete mat-icon {
      color: #F44336;
    }
    
    .timeline-icon.permission {
      background-color: rgba(156, 39, 176, 0.1);
    }
    
    .timeline-icon.permission mat-icon {
      color: #9C27B0;
    }
    
    .timeline-content {
      background-color: rgba(var(--background-tertiary-rgb), 0.3);
      border-radius: 8px;
      padding: 12px;
      flex: 1;
    }
    
    .timeline-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .user-name {
      font-weight: 500;
      color: var(--text-primary);
      margin-right: 8px;
    }
    
    .action-type {
      color: var(--text-secondary);
    }
    
    .timeline-time {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    
    .timeline-details {
      background-color: rgba(var(--background-primary-rgb), 0.3);
      border-radius: 4px;
      padding: 8px;
    }
    
    .detail-item {
      display: flex;
      margin-bottom: 4px;
      font-size: 13px;
    }
    
    .detail-item:last-child {
      margin-bottom: 0;
    }
    
    .detail-label {
      font-weight: 500;
      color: var(--text-secondary);
      margin-right: 8px;
      min-width: 80px;
    }
    
    .detail-value {
      color: var(--text-primary);
    }
    
    .load-more {
      text-align: center;
    }
    
    /* User Form */
    .form-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    }
    
    .form-dialog {
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      background-color: var(--card-bg);
      border-radius: 8px;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
    }
    
    .close-button {
      position: absolute;
      top: 8px;
      right: 8px;
    }
    
    .user-form {
      padding: 16px;
    }
    
    .form-section {
      margin-bottom: 24px;
    }
    
    .form-section h3 {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 16px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .form-row mat-form-field {
      flex: 1;
    }
    
    .form-field {
      flex: 1;
      display: flex;
      align-items: center;
      height: 59.5px; /* Match height of mat-form-field */
    }
    
    .password-field {
      flex: 1;
      display: flex;
      align-items: center;
    }
    
    /* Responsive Adjustments */
    @media (max-width: 1200px) {
      .roles-permissions-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
      }
      
      .roles-list-container {
        height: auto;
        max-height: 300px;
      }
    }
    
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .user-row {
        height: auto;
      }
      
      .permissions-list {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  isLoading = false;
  displayedColumns: string[] = ['avatar', 'name', 'email', 'role', 'status', 'pharmacy', 'lastLogin', 'actions'];
  searchTerm = '';
  roleFilter = 'all';
  statusFilter = 'all';
  pharmacyFilter = 'all';
  
  showingUserForm = false;
  isEditMode = false;
  currentUser: User | null = null;
  userForm: FormGroup;
  selectedPermissions: string[] = [];
  selectedRole: Role | null = null;
  
  users: User[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'System',
      role: 'admin',
      status: 'active',
      lastLogin: new Date('2025-05-11T08:30:00'),
      createdAt: new Date('2025-01-01'),
      phoneNumber: '+33 1 23 45 67 89',
      permissions: ['all'],
      address: '123 Admin Street, Paris'
    },
    {
      id: 2,
      username: 'sophie',
      email: 'sophie.mercier@example.com',
      firstName: 'Sophie',
      lastName: 'Mercier',
      role: 'pharmacist',
      status: 'active',
      lastLogin: new Date('2025-05-10T16:45:00'),
      createdAt: new Date('2025-02-15'),
      phoneNumber: '+33 6 12 34 56 78',
      permissions: ['view_medicines', 'edit_medicines', 'view_orders', 'edit_orders'],
      pharmacy: {
        id: 1,
        name: 'Pharmacie Centrale'
      },
      address: '45 Rue des Pharmaciens, Paris'
    },
    {
      id: 3,
      username: 'thomas',
      email: 'thomas.leroy@example.com',
      firstName: 'Thomas',
      lastName: 'Leroy',
      role: 'pharmacy_admin',
      status: 'active',
      lastLogin: new Date('2025-05-09T14:20:00'),
      createdAt: new Date('2025-02-20'),
      phoneNumber: '+33 6 23 45 67 89',
      permissions: ['manage_pharmacy', 'view_medicines', 'edit_medicines', 'view_orders', 'edit_orders'],
      pharmacy: {
        id: 2,
        name: 'Pharmacie Nord'
      },
      address: '78 Avenue du Nord, Paris'
    },
    {
      id: 4,
      username: 'jean',
      email: 'jean.dupont@example.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'delivery',
      status: 'active',
      lastLogin: new Date('2025-05-11T10:15:00'),
      createdAt: new Date('2025-03-01'),
      phoneNumber: '+33 6 34 56 78 90',
      permissions: ['view_orders', 'update_delivery'],
      address: '12 Rue de la Livraison, Paris'
    },
    {
      id: 5,
      username: 'marie',
      email: 'marie.dubois@example.com',
      firstName: 'Marie',
      lastName: 'Dubois',
      role: 'pharmacist',
      status: 'pending',
      createdAt: new Date('2025-05-10'),
      permissions: ['view_medicines', 'view_orders'],
      pharmacy: {
        id: 1,
        name: 'Pharmacie Centrale'
      }
    },
    {
      id: 6,
      username: 'pierre',
      email: 'pierre.martin@example.com',
      firstName: 'Pierre',
      lastName: 'Martin',
      role: 'customer',
      status: 'inactive',
      lastLogin: new Date('2025-04-15T09:30:00'),
      createdAt: new Date('2025-03-10'),
      phoneNumber: '+33 6 45 67 89 01',
      permissions: ['view_own_orders'],
      address: '34 Boulevard Saint-Michel, Paris'
    },
    {
      id: 7,
      username: 'lucas',
      email: 'lucas.richard@example.com',
      firstName: 'Lucas',
      lastName: 'Richard',
      role: 'delivery',
      status: 'blocked',
      lastLogin: new Date('2025-04-20T11:45:00'),
      createdAt: new Date('2025-03-15'),
      phoneNumber: '+33 6 56 78 90 12',
      permissions: ['view_orders'],
      address: '56 Rue de Rivoli, Paris'
    }
  ];
  
  roles: Role[] = [
    {
      id: 'admin',
      name: 'Administrateur',
      description: 'Accès complet à toutes les fonctionnalités du système',
      permissions: ['all'],
      usersCount: 1,
      isSystem: true,
      createdAt: new Date('2025-01-01')
    },
    {
      id: 'pharmacy_admin',
      name: 'Admin Pharmacie',
      description: 'Gestion d\'une pharmacie spécifique',
      permissions: ['manage_pharmacy', 'view_medicines', 'edit_medicines', 'view_orders', 'edit_orders', 'view_users', 'edit_users'],
      usersCount: 1,
      isSystem: false,
      createdAt: new Date('2025-01-01')
    },
    {
      id: 'pharmacist',
      name: 'Pharmacien',
      description: 'Personnel travaillant dans une pharmacie',
      permissions: ['view_medicines', 'edit_medicines', 'view_orders', 'edit_orders'],
      usersCount: 2,
      isSystem: false,
      createdAt: new Date('2025-01-01')
    },
    {
      id: 'delivery',
      name: 'Livreur',
      description: 'Responsable de la livraison des médicaments',
      permissions: ['view_orders', 'update_delivery'],
      usersCount: 2,
      isSystem: false,
      createdAt: new Date('2025-01-01')
    },
    {
      id: 'customer',
      name: 'Client',
      description: 'Utilisateur final de l\'application',
      permissions: ['view_own_orders'],
      usersCount: 1,
      isSystem: true,
      createdAt: new Date('2025-01-01')
    }
  ];
  
  permissions: Permission[] = [
    { id: 'view_dashboard', name: 'Voir le tableau de bord', description: 'Accéder au tableau de bord', category: 'Dashboard' },
    { id: 'view_medicines', name: 'Voir les médicaments', description: 'Consulter la liste des médicaments', category: 'Médicaments' },
    { id: 'edit_medicines', name: 'Modifier les médicaments', description: 'Ajouter, modifier ou supprimer des médicaments', category: 'Médicaments' },
    { id: 'view_orders', name: 'Voir les commandes', description: 'Consulter les commandes', category: 'Commandes' },
    { id: 'edit_orders', name: 'Modifier les commandes', description: 'Modifier le statut des commandes', category: 'Commandes' },
    { id: 'update_delivery', name: 'Mettre à jour les livraisons', description: 'Mettre à jour le statut des livraisons', category: 'Livraisons' },
    { id: 'view_statistics', name: 'Voir les statistiques', description: 'Accéder aux statistiques et rapports', category: 'Rapports' },
    { id: 'view_users', name: 'Voir les utilisateurs', description: 'Consulter la liste des utilisateurs', category: 'Utilisateurs' },
    { id: 'edit_users', name: 'Modifier les utilisateurs', description: 'Ajouter, modifier ou supprimer des utilisateurs', category: 'Utilisateurs' },
    { id: 'manage_pharmacy', name: 'Gérer la pharmacie', description: 'Gérer les paramètres d\'une pharmacie', category: 'Pharmacie' },
    { id: 'view_own_orders', name: 'Voir ses commandes', description: 'Consulter ses propres commandes', category: 'Commandes' },
    { id: 'all', name: 'Toutes les permissions', description: 'Accès complet à toutes les fonctionnalités', category: 'Système' }
  ];
  
  permissionCategories = ['Dashboard', 'Médicaments', 'Commandes', 'Livraisons', 'Rapports', 'Utilisateurs', 'Pharmacie', 'Système'];

  constructor(private fb: FormBuilder) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    // Simulate loading
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }
  
  get filteredUsers(): User[] {
    return this.users.filter(user => {
      // Search term filter
      const searchMatch = !this.searchTerm || 
        user.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // Role filter
      const roleMatch = this.roleFilter === 'all' || user.role === this.roleFilter;
      
      // Status filter
      const statusMatch = this.statusFilter === 'all' || user.status === this.statusFilter;
      
      // Pharmacy filter
      const pharmacyMatch = this.pharmacyFilter === 'all' || 
        (user.pharmacy && user.pharmacy.id.toString() === this.pharmacyFilter);
      
      return searchMatch && roleMatch && statusMatch && pharmacyMatch;
    });
  }
  
  getRoleLabel(roleId: string): string {
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  }
  
  getRoleBadgeClass(roleId: string): string {
    switch (roleId) {
      case 'admin':
        return 'role-admin';
      case 'pharmacist':
        return 'role-pharmacist';
      case 'delivery':
        return 'role-delivery';
      case 'customer':
        return 'role-customer';
      case 'pharmacy_admin':
        return 'role-pharmacy-admin';
      default:
        return '';
    }
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'pending':
        return 'En attente';
      case 'blocked':
        return 'Bloqué';
      default:
        return status;
    }
  }
  
  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = 'all';
    this.statusFilter = 'all';
    this.pharmacyFilter = 'all';
  }
  
  onTabChange(event: any): void {
    // Reset selections when changing tabs
    if (event.index !== 1) {
      this.selectedRole = null;
      this.selectedPermissions = [];
    }
  }
  
  // User form methods
  createUserForm(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      address: [''],
      role: ['', Validators.required],
      status: ['active', Validators.required],
      pharmacyId: [null],
      sendPasswordEmail: [true]
    });
  }
  
  showAddUserForm(): void {
    this.isEditMode = false;
    this.currentUser = null;
    this.userForm.reset({
      status: 'active',
      sendPasswordEmail: true
    });
    this.showingUserForm = true;
  }
  
  editUser(user: User): void {
    this.isEditMode = true;
    this.currentUser = user;
    
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      role: user.role,
      status: user.status,
      pharmacyId: user.pharmacy ? user.pharmacy.id : null
    });
    
    this.showingUserForm = true;
  }
  
  cancelUserForm(): void {
    this.showingUserForm = false;
  }
  
  saveUser(): void {
    if (this.userForm.invalid) {
      return;
    }
    
    const formData = this.userForm.value;
    
    if (this.isEditMode && this.currentUser) {
      // Update existing user
      const index = this.users.findIndex(u => u.id === this.currentUser!.id);
      if (index !== -1) {
        this.users[index] = {
          ...this.currentUser,
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          role: formData.role,
          status: formData.status,
          pharmacy: formData.pharmacyId ? {
            id: formData.pharmacyId,
            name: this.getPharmacyName(formData.pharmacyId)
          } : undefined
        };
      }
    } else {
      // Create new user
      const newUser: User = {
        id: this.users.length + 1,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        role: formData.role,
        status: formData.status,
        createdAt: new Date(),
        permissions: [],
        pharmacy: formData.pharmacyId ? {
          id: formData.pharmacyId,
          name: this.getPharmacyName(formData.pharmacyId)
        } : undefined
      };
      
      this.users.unshift(newUser);
    }
    
    this.showingUserForm = false;
  }
  
  getPharmacyName(id: number): string {
    switch (id) {
      case 1: return 'Pharmacie Centrale';
      case 2: return 'Pharmacie Nord';
      case 3: return 'Pharmacie Est';
      default: return `Pharmacie ${id}`;
    }
  }
  
  viewUserDetails(user: User): void {
    console.log('View user details:', user);
  }
  
  resetPassword(user: User): void {
    console.log('Reset password for:', user);
  }
  
  blockUser(user: User): void {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index].status = 'blocked';
    }
  }
  
  unblockUser(user: User): void {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index].status = 'active';
    }
  }
  
  deleteUser(user: User): void {
    this.users = this.users.filter(u => u.id !== user.id);
  }
  
  // Roles and permissions methods
  selectRole(role: Role): void {
    this.selectedRole = role;
    
    if (role.permissions.includes('all')) {
      this.selectedPermissions = this.permissions.map(p => p.id);
    } else {
      this.selectedPermissions = [...role.permissions];
    }
  }
  
  getPermissionsByCategory(category: string): Permission[] {
    return this.permissions.filter(p => p.category === category);
  }
  
  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.includes(permissionId);
  }
  
  togglePermission(permissionId: string, checked: boolean): void {
    if (checked) {
      this.selectedPermissions.push(permissionId);
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(id => id !== permissionId);
    }
  }
  
  isAllCategorySelected(category: string): boolean {
    const categoryPermissions = this.getPermissionsByCategory(category);
    return categoryPermissions.every(p => this.selectedPermissions.includes(p.id));
  }
  
  toggleCategory(category: string, checked: boolean): void {
    const categoryPermissions = this.getPermissionsByCategory(category);
    
    if (checked) {
      // Add all permissions from this category
      categoryPermissions.forEach(p => {
        if (!this.selectedPermissions.includes(p.id)) {
          this.selectedPermissions.push(p.id);
        }
      });
    } else {
      // Remove all permissions from this category
      this.selectedPermissions = this.selectedPermissions.filter(id => 
        !categoryPermissions.some(p => p.id === id)
      );
    }
  }
  
  getPermissionName(permissionId: string): string {
    const permission = this.permissions.find(p => p.id === permissionId);
    return permission ? permission.name : permissionId;
  }
  
  addNewRole(): void {
    console.log('Add new role');
  }
  
  editRole(role: Role, event: Event): void {
    event.stopPropagation();
    console.log('Edit role:', role);
  }
  
  deleteRole(role: Role, event: Event): void {
    event.stopPropagation();
    this.roles = this.roles.filter(r => r.id !== role.id);
    
    if (this.selectedRole && this.selectedRole.id === role.id) {
      this.selectedRole = null;
    }
  }
  
  saveRoleChanges(): void {
    if (!this.selectedRole) return;
    
    const roleIndex = this.roles.findIndex(r => r.id === this.selectedRole!.id);
    if (roleIndex !== -1) {
      this.roles[roleIndex] = {
        ...this.selectedRole,
        permissions: [...this.selectedPermissions]
      };
    }
  }
}