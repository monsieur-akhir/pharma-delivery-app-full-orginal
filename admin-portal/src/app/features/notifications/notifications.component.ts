import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FuturisticLoaderComponent } from '../../shared/components/futuristic-loader/futuristic-loader.component';
import { NotificationService } from '../../core/services/api/notification.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { Subscription } from 'rxjs';
import { Notification as ApiNotification } from '../../shared/models/notification.model';

// Interface étendue pour les notifications UI
interface Notification {
  id: string;
  type: 'order' | 'system' | 'pharmacy' | 'alert' | 'user';
  title: string;
  content: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionable: boolean;
  actions?: {
    name: string;
    icon: string;
    color?: string;
  }[];
  sender?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatBadgeModule,
    FormsModule,
    ReactiveFormsModule,
    FuturisticLoaderComponent
  ],
  template: `
    <div class="notifications-container">
      <!-- Loader overlay when loading -->
      <div class="loader-overlay" *ngIf="isLoading">
        <app-futuristic-loader 
          type="medical" 
          message="Chargement des notifications..."
          [showProgress]="true"
          [progress]="65">
        </app-futuristic-loader>
      </div>

      <!-- Header section -->
      <div class="page-header">
        <div class="header-title">
          <h1>Notifications</h1>
          <p class="subtitle">Gérez les alertes et les communications du système</p>
        </div>
        
        <div class="header-actions">
          <button mat-raised-button color="primary" class="action-button">
            <mat-icon>add</mat-icon>
            Nouvelle notification
          </button>
          
          <button mat-raised-button color="accent" class="action-button" [matBadge]="getUnreadCount()" matBadgePosition="before" matBadgeColor="warn">
            <mat-icon>mark_email_read</mat-icon>
            Tout marquer comme lu
          </button>
          
          <button mat-icon-button matTooltip="Paramètres des notifications" color="primary">
            <mat-icon>settings</mat-icon>
          </button>
        </div>
      </div>

      <!-- Notification Filters -->
      <div class="notification-filters">
        <mat-button-toggle-group [value]="currentFilter" (change)="setFilter($event.value)">
          <mat-button-toggle value="all" matTooltip="Toutes les notifications">
            <mat-icon>all_inbox</mat-icon>
            <span>Toutes</span>
            <span class="filter-badge">{{ notifications.length }}</span>
          </mat-button-toggle>
          
          <mat-button-toggle value="unread" matTooltip="Non-lues">
            <mat-icon>mail</mat-icon>
            <span>Non-lues</span>
            <span class="filter-badge">{{ getUnreadCount() }}</span>
          </mat-button-toggle>
          
          <mat-button-toggle value="order" matTooltip="Commandes">
            <mat-icon>shopping_cart</mat-icon>
            <span>Commandes</span>
            <span class="filter-badge">{{ getTypeCount('order') }}</span>
          </mat-button-toggle>
          
          <mat-button-toggle value="pharmacy" matTooltip="Pharmacies">
            <mat-icon>local_pharmacy</mat-icon>
            <span>Pharmacies</span>
            <span class="filter-badge">{{ getTypeCount('pharmacy') }}</span>
          </mat-button-toggle>
          
          <mat-button-toggle value="alert" matTooltip="Alertes">
            <mat-icon>warning</mat-icon>
            <span>Alertes</span>
            <span class="filter-badge">{{ getTypeCount('alert') }}</span>
          </mat-button-toggle>
          
          <mat-button-toggle value="system" matTooltip="Système">
            <mat-icon>memory</mat-icon>
            <span>Système</span>
            <span class="filter-badge">{{ getTypeCount('system') }}</span>
          </mat-button-toggle>
          
          <mat-button-toggle value="user" matTooltip="Utilisateurs">
            <mat-icon>people</mat-icon>
            <span>Utilisateurs</span>
            <span class="filter-badge">{{ getTypeCount('user') }}</span>
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <!-- Main Content -->
      <div class="notifications-content">
        <!-- Left Panel - Notification List -->
        <div class="notifications-list-container">
          <mat-card class="notifications-card">
            <mat-card-header>
              <mat-card-title>
                <div class="section-header">
                  <span>{{ getFilterLabel() }}</span>
                  <div class="header-tools">
                    <mat-form-field appearance="outline" class="search-field">
                      <mat-label>Rechercher</mat-label>
                      <input matInput placeholder="Mot-clé...">
                      <mat-icon matSuffix>search</mat-icon>
                    </mat-form-field>
                    
                    <button mat-icon-button matTooltip="Actualiser">
                      <mat-icon>refresh</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <div class="notifications-list">
                <div *ngFor="let notification of getFilteredNotifications()" 
                     class="notification-item"
                     [ngClass]="{'unread': !notification.read, 'selected': selectedNotification?.id === notification.id}"
                     (click)="selectNotification(notification)">
                  
                  <div class="notification-icon" [ngClass]="'type-' + notification.type">
                    <mat-icon>{{ getTypeIcon(notification.type) }}</mat-icon>
                  </div>
                  
                  <div class="notification-content">
                    <div class="notification-header">
                      <div class="notification-title">{{ notification.title }}</div>
                      <div class="notification-time">{{ notification.timestamp | date:'HH:mm' }}</div>
                    </div>
                    
                    <div class="notification-body">{{ notification.content | slice:0:80 }}{{ notification.content.length > 80 ? '...' : '' }}</div>
                    
                    <div class="notification-footer">
                      <div class="priority-badge" [ngClass]="'priority-' + notification.priority">
                        {{ getPriorityLabel(notification.priority) }}
                      </div>
                      
                      <div class="notification-sender" *ngIf="notification.sender">
                        <span>{{ notification.sender.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Empty state -->
                <div *ngIf="getFilteredNotifications().length === 0" class="empty-state">
                  <mat-icon>notifications_off</mat-icon>
                  <h3>Aucune notification</h3>
                  <p>Vous n'avez pas de notifications correspondant à ce filtre</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
        
        <!-- Right Panel - Notification Detail or Settings -->
        <div class="notification-detail-container">
          <ng-container *ngIf="selectedNotification; else notificationSettings">
            <mat-card class="detail-card">
              <mat-card-header>
                <div mat-card-avatar class="detail-icon" [ngClass]="'type-' + selectedNotification.type">
                  <mat-icon>{{ getTypeIcon(selectedNotification.type) }}</mat-icon>
                </div>
                <mat-card-title>{{ selectedNotification.title }}</mat-card-title>
                <mat-card-subtitle>
                  <div class="detail-meta">
                    <span class="detail-time">{{ selectedNotification.timestamp | date:'dd/MM/yyyy HH:mm' }}</span>
                    <div class="priority-badge" [ngClass]="'priority-' + selectedNotification.priority">
                      {{ getPriorityLabel(selectedNotification.priority) }}
                    </div>
                  </div>
                </mat-card-subtitle>
                
                <div class="detail-actions">
                  <button mat-icon-button matTooltip="Marquer comme non lu" *ngIf="selectedNotification.read">
                    <mat-icon>mail</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Marquer comme lu" *ngIf="!selectedNotification.read">
                    <mat-icon>mark_email_read</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Archiver">
                    <mat-icon>archive</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Supprimer" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-card-header>
              
              <mat-divider></mat-divider>
              
              <mat-card-content>
                <div class="detail-sender" *ngIf="selectedNotification.sender">
                  <div class="sender-avatar">
                    <div class="avatar-placeholder">
                      <mat-icon>person</mat-icon>
                    </div>
                  </div>
                  <div class="sender-info">
                    <div class="sender-name">{{ selectedNotification.sender.name }}</div>
                    <div class="sender-role">{{ selectedNotification.sender.role }}</div>
                  </div>
                </div>
                
                <div class="detail-content">
                  <p>{{ selectedNotification.content }}</p>
                </div>
                
                <div class="detail-attachments" *ngIf="hasAttachments(selectedNotification)">
                  <h4>Pièces jointes</h4>
                  <div class="attachments-list">
                    <div class="attachment-item">
                      <mat-icon>insert_drive_file</mat-icon>
                      <span>rapport-mensuel.pdf</span>
                      <button mat-icon-button><mat-icon>download</mat-icon></button>
                    </div>
                  </div>
                </div>
              </mat-card-content>
              
              <mat-divider *ngIf="selectedNotification.actionable"></mat-divider>
              
              <mat-card-actions *ngIf="selectedNotification.actionable">
                <div class="action-buttons">
                  <ng-container *ngFor="let action of selectedNotification.actions">
                    <button mat-raised-button [color]="action.color || 'primary'">
                      <mat-icon>{{ action.icon }}</mat-icon>
                      {{ action.name }}
                    </button>
                  </ng-container>
                </div>
              </mat-card-actions>
            </mat-card>
          </ng-container>
          
          <ng-template #notificationSettings>
            <mat-card class="settings-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>settings</mat-icon>
                <mat-card-title>Paramètres des notifications</mat-card-title>
                <mat-card-subtitle>Configurer vos préférences de notification</mat-card-subtitle>
              </mat-card-header>
              
              <mat-divider></mat-divider>
              
              <mat-card-content>
                <div class="settings-section">
                  <h3>Canaux de notification</h3>
                  
                  <div class="settings-option">
                    <div class="option-header">
                      <mat-icon>email</mat-icon>
                      <span>Notifications par e-mail</span>
                    </div>
                    <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                  </div>
                  
                  <div class="settings-option">
                    <div class="option-header">
                      <mat-icon>sms</mat-icon>
                      <span>Notifications par SMS</span>
                    </div>
                    <mat-slide-toggle [checked]="false"></mat-slide-toggle>
                  </div>
                  
                  <div class="settings-option">
                    <div class="option-header">
                      <mat-icon>notifications</mat-icon>
                      <span>Notifications push</span>
                    </div>
                    <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                  </div>
                  
                  <div class="settings-option">
                    <div class="option-header">
                      <mat-icon>desktop_windows</mat-icon>
                      <span>Notifications dans l'application</span>
                    </div>
                    <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                  </div>
                </div>
                
                <mat-divider></mat-divider>
                
                <div class="settings-section">
                  <h3>Types de notifications</h3>
                  
                  <div class="settings-group">
                    <h4>Commandes</h4>
                    <div class="settings-option small">
                      <span>Nouvelles commandes</span>
                      <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                    </div>
                    <div class="settings-option small">
                      <span>Modifications de commandes</span>
                      <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                    </div>
                    <div class="settings-option small">
                      <span>Annulations</span>
                      <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                    </div>
                  </div>
                  
                  <div class="settings-group">
                    <h4>Livraisons</h4>
                    <div class="settings-option small">
                      <span>Mises à jour de statut</span>
                      <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                    </div>
                    <div class="settings-option small">
                      <span>Retards</span>
                      <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                    </div>
                  </div>
                  
                  <div class="settings-group">
                    <h4>Inventaire</h4>
                    <div class="settings-option small">
                      <span>Stock bas</span>
                      <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                    </div>
                    <div class="settings-option small">
                      <span>Nouveaux arrivages</span>
                      <mat-slide-toggle [checked]="false"></mat-slide-toggle>
                    </div>
                    <div class="settings-option small">
                      <span>Expirations proches</span>
                      <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                    </div>
                  </div>
                  
                  <div class="settings-group">
                    <h4>Système</h4>
                    <div class="settings-option small">
                      <span>Mises à jour</span>
                      <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                    </div>
                    <div class="settings-option small">
                      <span>Erreurs</span>
                      <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                    </div>
                    <div class="settings-option small">
                      <span>Maintenance</span>
                      <mat-slide-toggle [checked]="true"></mat-slide-toggle>
                    </div>
                  </div>
                </div>
                
                <mat-divider></mat-divider>
                
                <div class="settings-section">
                  <h3>Priorités</h3>
                  
                  <div class="settings-option">
                    <div class="option-header">
                      <div class="priority-dot priority-urgent"></div>
                      <span>Notifications urgentes</span>
                    </div>
                    <mat-form-field appearance="outline">
                      <mat-label>Canal</mat-label>
                      <mat-select [value]="'all'">
                        <mat-option value="all">Tous les canaux</mat-option>
                        <mat-option value="email">E-mail uniquement</mat-option>
                        <mat-option value="sms">SMS uniquement</mat-option>
                        <mat-option value="push">Push uniquement</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  
                  <div class="settings-option">
                    <div class="option-header">
                      <div class="priority-dot priority-high"></div>
                      <span>Notifications haute priorité</span>
                    </div>
                    <mat-form-field appearance="outline">
                      <mat-label>Canal</mat-label>
                      <mat-select [value]="'email-push'">
                        <mat-option value="all">Tous les canaux</mat-option>
                        <mat-option value="email-push">E-mail et Push</mat-option>
                        <mat-option value="email">E-mail uniquement</mat-option>
                        <mat-option value="push">Push uniquement</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  
                  <div class="settings-option">
                    <div class="option-header">
                      <div class="priority-dot priority-medium"></div>
                      <span>Notifications priorité moyenne</span>
                    </div>
                    <mat-form-field appearance="outline">
                      <mat-label>Canal</mat-label>
                      <mat-select [value]="'app'">
                        <mat-option value="all">Tous les canaux</mat-option>
                        <mat-option value="email">E-mail uniquement</mat-option>
                        <mat-option value="app">Application uniquement</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  
                  <div class="settings-option">
                    <div class="option-header">
                      <div class="priority-dot priority-low"></div>
                      <span>Notifications basse priorité</span>
                    </div>
                    <mat-form-field appearance="outline">
                      <mat-label>Canal</mat-label>
                      <mat-select [value]="'app'">
                        <mat-option value="all">Tous les canaux</mat-option>
                        <mat-option value="email">E-mail uniquement</mat-option>
                        <mat-option value="app">Application uniquement</mat-option>
                        <mat-option value="none">Aucun (désactivé)</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>
              </mat-card-content>
              
              <mat-divider></mat-divider>
              
              <mat-card-actions align="end">
                <button mat-button>Annuler</button>
                <button mat-raised-button color="primary">Enregistrer</button>
              </mat-card-actions>
            </mat-card>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
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
      min-width: 110px;
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
    
    .notification-filters {
      margin-bottom: 20px;
    }
    
    .mat-button-toggle-group {
      border-radius: 30px;
      overflow: hidden;
      box-shadow: 0 4px 8px var(--shadow-color);
      border: 1px solid var(--border-color);
      width: 100%;
      display: flex;
      background-color: var(--card-bg);
    }
    
    .mat-button-toggle {
      flex: 1;
      min-width: 120px;
      padding: 8px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .mat-button-toggle::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: transparent;
      transition: background 0.3s ease;
    }
    
    .mat-button-toggle.mat-button-toggle-checked::before {
      background: var(--accent-color);
    }
    
    .mat-button-toggle-label-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: normal !important;
      padding: 8px 0;
    }
    
    .mat-button-toggle span {
      display: block;
      margin-top: 4px;
      font-size: 14px;
    }
    
    .mat-button-toggle.mat-button-toggle-checked {
      background-color: rgba(var(--accent-color-rgb), 0.1);
      color: var(--accent-color);
    }
    
    .filter-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: rgba(var(--background-tertiary-rgb), 0.8);
      color: var(--text-secondary);
      font-size: 12px;
      border-radius: 12px;
      padding: 2px 6px;
      min-width: 20px;
      text-align: center;
    }
    
    .mat-button-toggle.mat-button-toggle-checked .filter-badge {
      background-color: var(--accent-color);
      color: white;
    }
    
    .notifications-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .notifications-card, .detail-card, .settings-card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .header-tools {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .search-field {
      width: 200px;
      font-size: 14px;
    }
    
    ::ng-deep .search-field .mat-form-field-wrapper {
      padding-bottom: 0;
    }
    
    .notifications-list {
      max-height: 600px;
      overflow-y: auto;
      padding-right: 8px;
    }
    
    .notification-item {
      display: flex;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      background-color: rgba(var(--background-tertiary-rgb), 0.3);
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .notification-item:hover {
      box-shadow: 0 4px 8px var(--shadow-color);
      transform: translateY(-2px);
      background-color: rgba(var(--hover-bg-rgb), 0.2);
    }
    
    .notification-item.unread {
      border-left: 3px solid var(--accent-color);
    }
    
    .notification-item.selected {
      background-color: rgba(var(--accent-color-rgb), 0.1);
      border-color: var(--accent-color);
    }
    
    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .notification-icon.type-order {
      background-color: rgba(25, 118, 210, 0.2);
    }
    
    .notification-icon.type-order mat-icon {
      color: #2196F3;
    }
    
    .notification-icon.type-system {
      background-color: rgba(96, 125, 139, 0.2);
    }
    
    .notification-icon.type-system mat-icon {
      color: #607D8B;
    }
    
    .notification-icon.type-pharmacy {
      background-color: rgba(76, 175, 80, 0.2);
    }
    
    .notification-icon.type-pharmacy mat-icon {
      color: #4CAF50;
    }
    
    .notification-icon.type-alert {
      background-color: rgba(255, 87, 34, 0.2);
    }
    
    .notification-icon.type-alert mat-icon {
      color: #FF5722;
    }
    
    .notification-icon.type-user {
      background-color: rgba(156, 39, 176, 0.2);
    }
    
    .notification-icon.type-user mat-icon {
      color: #9C27B0;
    }
    
    .notification-content {
      flex: 1;
      min-width: 0;
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    
    .notification-title {
      font-weight: 500;
      font-size: 16px;
      color: var(--text-primary);
      margin-right: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .notification-time {
      font-size: 12px;
      color: var(--text-secondary);
      white-space: nowrap;
    }
    
    .notification-body {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .notification-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .priority-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .priority-badge.priority-low {
      background-color: rgba(76, 175, 80, 0.2);
      color: #4CAF50;
    }
    
    .priority-badge.priority-medium {
      background-color: rgba(33, 150, 243, 0.2);
      color: #2196F3;
    }
    
    .priority-badge.priority-high {
      background-color: rgba(255, 152, 0, 0.2);
      color: #FF9800;
    }
    
    .priority-badge.priority-urgent {
      background-color: rgba(244, 67, 54, 0.2);
      color: #F44336;
    }
    
    .notification-sender {
      font-size: 12px;
      color: var(--text-muted);
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
      margin: 0;
      color: var(--text-secondary);
    }
    
    .detail-card {
      overflow: visible;
    }
    
    .detail-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .detail-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .detail-time {
      color: var(--text-secondary);
    }
    
    .detail-actions {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 4px;
    }
    
    .detail-content {
      padding: 20px 0;
      font-size: 16px;
      color: var(--text-primary);
      line-height: 1.6;
    }
    
    .detail-sender {
      display: flex;
      align-items: center;
      margin-top: 20px;
      margin-bottom: 20px;
      padding: 12px;
      background-color: rgba(var(--background-tertiary-rgb), 0.3);
      border-radius: 8px;
    }
    
    .sender-avatar {
      width: 50px;
      height: 50px;
      border-radius: 25px;
      margin-right: 16px;
      overflow: hidden;
      flex-shrink: 0;
    }
    
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background-color: rgba(var(--accent-color-rgb), 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .avatar-placeholder mat-icon {
      color: var(--accent-color);
    }
    
    .sender-info {
      flex: 1;
    }
    
    .sender-name {
      font-weight: 500;
      font-size: 16px;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .sender-role {
      font-size: 14px;
      color: var(--text-secondary);
    }
    
    .detail-attachments {
      margin-top: 20px;
      padding: 16px;
      background-color: rgba(var(--background-tertiary-rgb), 0.3);
      border-radius: 8px;
    }
    
    .detail-attachments h4 {
      margin: 0 0 12px;
      font-size: 16px;
      color: var(--text-primary);
    }
    
    .attachment-item {
      display: flex;
      align-items: center;
      padding: 8px;
      background-color: rgba(var(--background-secondary-rgb), 0.5);
      border-radius: 4px;
    }
    
    .attachment-item mat-icon {
      margin-right: 8px;
      color: var(--accent-color);
    }
    
    .action-buttons {
      display: flex;
      gap: 8px;
      margin: 8px;
      flex-wrap: wrap;
    }
    
    .settings-section {
      padding: 20px 0;
    }
    
    .settings-section h3 {
      margin: 0 0 20px;
      font-size: 18px;
      color: var(--text-primary);
    }
    
    .settings-group {
      margin-bottom: 24px;
    }
    
    .settings-group h4 {
      margin: 0 0 12px;
      font-size: 16px;
      color: var(--text-primary);
      border-left: 3px solid var(--accent-color);
      padding-left: 8px;
    }
    
    .settings-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 8px;
      border-radius: 8px;
      transition: background-color 0.2s;
    }
    
    .settings-option:hover {
      background-color: rgba(var(--hover-bg-rgb), 0.1);
    }
    
    .settings-option.small {
      margin-bottom: 8px;
      padding: 4px 8px;
    }
    
    .option-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .option-header mat-icon {
      color: var(--accent-color);
    }
    
    .priority-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    .priority-dot.priority-urgent {
      background-color: #F44336;
    }
    
    .priority-dot.priority-high {
      background-color: #FF9800;
    }
    
    .priority-dot.priority-medium {
      background-color: #2196F3;
    }
    
    .priority-dot.priority-low {
      background-color: #4CAF50;
    }
    
    /* Responsive Adjustments */
    @media (max-width: 1200px) {
      .notifications-content {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
    
    @media (max-width: 768px) {
      .header-actions {
        flex-wrap: wrap;
      }
      
      .mat-button-toggle {
        min-width: unset;
      }
      
      .mat-button-toggle span:not(.filter-badge) {
        display: none;
      }
      
      .search-field {
        width: 150px;
      }
    }
    
    @media (max-width: 480px) {
      .notification-item {
        flex-direction: column;
      }
      
      .notification-icon {
        margin-bottom: 8px;
      }
      
      .notification-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  isLoading = false;
  currentFilter = 'all';
  selectedNotification: Notification | null = null;
  
  notifications: Notification[] = [
    {
      id: '1',
      type: 'order',
      title: 'Nouvelle commande reçue',
      content: 'La commande #4582 a été reçue et est en attente de traitement. Veuillez vérifier les détails et confirmer la disponibilité des médicaments.',
      timestamp: new Date('2025-05-11T10:30:00'),
      read: false,
      priority: 'medium',
      actionable: true,
      actions: [
        { name: 'Voir la commande', icon: 'visibility' },
        { name: 'Traiter', icon: 'check_circle', color: 'accent' }
      ]
    },
    {
      id: '2',
      type: 'alert',
      title: 'Stock critique',
      content: 'Le médicament "Amoxicilline 500mg" est en rupture de stock. Veuillez commander de nouvelles unités dès que possible pour éviter des problèmes de service.',
      timestamp: new Date('2025-05-11T09:15:00'),
      read: false,
      priority: 'high',
      actionable: true,
      actions: [
        { name: 'Commander', icon: 'add_shopping_cart', color: 'primary' },
        { name: 'Ignorer', icon: 'close', color: 'warn' }
      ]
    },
    {
      id: '3',
      type: 'pharmacy',
      title: 'Maintenance planifiée',
      content: 'Une maintenance du système est planifiée pour le 15/05/2025 à 22h00. Le système sera indisponible pendant environ 2 heures. Veuillez planifier vos activités en conséquence.',
      timestamp: new Date('2025-05-11T08:45:00'),
      read: true,
      priority: 'medium',
      actionable: false
    },
    {
      id: '4',
      type: 'system',
      title: 'Mise à jour du système',
      content: 'Une nouvelle version du logiciel (v2.5.3) est disponible. Cette mise à jour inclut des améliorations de performance et de nouvelles fonctionnalités pour la gestion des prescriptions.',
      timestamp: new Date('2025-05-10T16:20:00'),
      read: true,
      priority: 'low',
      actionable: true,
      actions: [
        { name: 'Mettre à jour maintenant', icon: 'system_update', color: 'primary' },
        { name: 'Plus tard', icon: 'schedule' }
      ]
    },
    {
      id: '5',
      type: 'user',
      title: 'Nouveau message',
      content: 'Vous avez reçu un nouveau message de Sophie Mercier, pharmacienne à la Pharmacie Centrale. Elle demande des informations sur les nouveaux protocoles de prescription.',
      timestamp: new Date('2025-05-10T14:35:00'),
      read: false,
      priority: 'low',
      actionable: true,
      actions: [
        { name: 'Répondre', icon: 'reply', color: 'primary' }
      ],
      sender: {
        name: 'Sophie Mercier',
        role: 'Pharmacienne',
      }
    },
    {
      id: '6',
      type: 'alert',
      title: 'Livraison retardée',
      content: 'La livraison #3578 est actuellement en retard. Le livreur a signalé un problème de circulation. L\'heure d\'arrivée estimée est maintenant 17h30.',
      timestamp: new Date('2025-05-10T11:10:00'),
      read: true,
      priority: 'medium',
      actionable: true,
      actions: [
        { name: 'Contacter le livreur', icon: 'call', color: 'primary' },
        { name: 'Informer le client', icon: 'message' }
      ]
    },
    {
      id: '7',
      type: 'order',
      title: 'Commande modifiée',
      content: 'La commande #4570 a été modifiée par le client. Le médicament "Paracétamol 1000mg" a été remplacé par "Ibuprofène 400mg". Veuillez vérifier et confirmer les modifications.',
      timestamp: new Date('2025-05-10T09:45:00'),
      read: true,
      priority: 'medium',
      actionable: true,
      actions: [
        { name: 'Accepter les modifications', icon: 'check', color: 'primary' },
        { name: 'Refuser', icon: 'close', color: 'warn' }
      ]
    },
    {
      id: '8',
      type: 'system',
      title: 'Erreur système',
      content: 'Une erreur s\'est produite lors de la synchronisation des données avec le serveur central. Certaines informations pourraient ne pas être à jour. L\'équipe technique a été informée.',
      timestamp: new Date('2025-05-09T22:15:00'),
      read: true,
      priority: 'urgent',
      actionable: true,
      actions: [
        { name: 'Voir les détails', icon: 'error_outline', color: 'warn' },
        { name: 'Synchroniser à nouveau', icon: 'sync', color: 'primary' }
      ]
    }
  ];

  constructor(
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.loadNotifications();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  loadNotifications(): void {
    this.isLoading = true;
    
    // Chargement des notifications de l'API
    const sub = this.notificationService.getAllNotifications(1, 50)
      .subscribe({
        next: (response) => {
          // Conversion des données API vers le format utilisé par le composant
          const apiNotifications: Notification[] = response.notifications.map(apiNotif => ({
            id: apiNotif.id,
            type: this.mapApiTypeToUiType(apiNotif.type),
            title: apiNotif.title,
            content: apiNotif.message,
            timestamp: new Date(apiNotif.createdAt),
            read: apiNotif.read,
            priority: apiNotif.data?.['priority'] || 'low',
            actionable: apiNotif.data?.['actionable'] || false,
            actions: apiNotif.data?.['actions'] || [],
            sender: apiNotif.data?.['sender']
          }));
          
          // Fusionner avec les notifications de démonstration (simulées)
          this.notifications = [...apiNotifications, ...this.notifications];
          
          this.isLoading = false;
          
          // Auto-select first notification
          if (this.notifications.length > 0) {
            this.selectedNotification = this.notifications[0];
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.isLoading = false;
        }
      });
      
    this.subscription.add(sub);
  }
  
  // Convertir les types API en types d'interface utilisateur
  mapApiTypeToUiType(apiType: string): 'order' | 'system' | 'pharmacy' | 'alert' | 'user' {
    switch (apiType) {
      case 'order': return 'order';
      case 'prescription': return 'pharmacy';
      case 'payment': return 'order';
      case 'system': return 'system';
      default: return 'system';
    }
  }
  
  getFilteredNotifications(): Notification[] {
    if (this.currentFilter === 'all') {
      return this.notifications;
    } else if (this.currentFilter === 'unread') {
      return this.notifications.filter(n => !n.read);
    } else {
      return this.notifications.filter(n => n.type === this.currentFilter);
    }
  }
  
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
  
  getTypeCount(type: string): number {
    return this.notifications.filter(n => n.type === type).length;
  }
  
  getFilterLabel(): string {
    switch (this.currentFilter) {
      case 'all':
        return 'Toutes les notifications';
      case 'unread':
        return 'Notifications non lues';
      case 'order':
        return 'Commandes';
      case 'system':
        return 'Système';
      case 'pharmacy':
        return 'Pharmacies';
      case 'alert':
        return 'Alertes';
      case 'user':
        return 'Utilisateurs';
      default:
        return 'Notifications';
    }
  }
  
  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.selectedNotification = null;
  }
  
  selectNotification(notification: Notification): void {
    this.selectedNotification = notification;
    
    // Mark as read if it was unread
    if (!notification.read) {
      notification.read = true;
    }
  }
  
  getTypeIcon(type: string): string {
    switch (type) {
      case 'order':
        return 'shopping_cart';
      case 'system':
        return 'memory';
      case 'pharmacy':
        return 'local_pharmacy';
      case 'alert':
        return 'warning';
      case 'user':
        return 'person';
      default:
        return 'notifications';
    }
  }
  
  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'low':
        return 'Basse';
      case 'medium':
        return 'Moyenne';
      case 'high':
        return 'Haute';
      case 'urgent':
        return 'Urgente';
      default:
        return priority;
    }
  }
  
  hasAttachments(notification: Notification): boolean {
    // In a real app, this would check if the notification has attachments
    return notification.title.includes('rapport') || notification.content.includes('rapport');
  }
}