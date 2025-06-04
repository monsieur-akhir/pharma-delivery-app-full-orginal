import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuturisticLoaderComponent } from '../../shared/components/futuristic-loader/futuristic-loader.component';
import { ThemeSwitcherComponent } from '../../shared/components/theme-switcher/theme-switcher.component';

interface SystemInfo {
  version: string;
  uptime: string;
  serverTime: Date;
  nodeVersion: string;
  environment: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  databaseConnections: number;
  activeUsers: number;
  queuedJobs: number;
  lastBackup: Date;
  status: 'healthy' | 'warning' | 'critical';
}

interface ApiKeyInfo {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed?: Date;
  permissions: string[];
  status: 'active' | 'inactive';
}

interface IntegrationInfo {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  config: {
    [key: string]: any;
  };
}

interface BackupConfig {
  enabled: boolean;
  schedule: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string;
  retention: number;
  location: 'local' | 'cloud';
  includeUploads: boolean;
  encryptBackups: boolean;
}

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatDividerModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
    FuturisticLoaderComponent,
    ThemeSwitcherComponent
  ],
  template: `
    <div class="system-settings-container">
      <!-- Loader overlay when loading -->
      <div class="loader-overlay" *ngIf="isLoading">
        <app-futuristic-loader 
          type="medical" 
          message="Chargement des paramètres système..."
          [showProgress]="true"
          [progress]="65">
        </app-futuristic-loader>
      </div>

      <!-- Header section -->
      <div class="page-header">
        <div class="header-title">
          <h1>Paramètres Système</h1>
          <p class="subtitle">Configuration et maintenance du système</p>
        </div>
        
        <div class="health-status" [ngClass]="'status-' + systemInfo.status">
          <div class="status-indicator">
            <mat-icon *ngIf="systemInfo.status === 'healthy'">check_circle</mat-icon>
            <mat-icon *ngIf="systemInfo.status === 'warning'">warning</mat-icon>
            <mat-icon *ngIf="systemInfo.status === 'critical'">error</mat-icon>
          </div>
          <div class="status-text">
            <div class="status-label">État du système:</div>
            <div class="status-value">
              {{ systemInfo.status === 'healthy' ? 'En bonne santé' : 
                 systemInfo.status === 'warning' ? 'Avertissement' : 'Critique' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Main content tabs -->
      <mat-tab-group animationDuration="300ms" class="settings-tabs">
        <mat-tab label="Vue d'ensemble">
          <!-- Overview Tab -->
          <div class="tab-content">
            <!-- System Status Cards -->
            <div class="status-cards">
              <mat-card class="status-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>memory</mat-icon>
                  <mat-card-title>Système</mat-card-title>
                  <mat-card-subtitle>Informations sur le serveur</mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="info-list">
                    <div class="info-item">
                      <div class="info-label">Version</div>
                      <div class="info-value">{{ systemInfo.version }}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Environnement</div>
                      <div class="info-value">{{ systemInfo.environment }}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Uptime</div>
                      <div class="info-value">{{ systemInfo.uptime }}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Heure du serveur</div>
                      <div class="info-value">{{ systemInfo.serverTime | date:'dd/MM/yyyy HH:mm:ss' }}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Version Node.js</div>
                      <div class="info-value">{{ systemInfo.nodeVersion }}</div>
                    </div>
                  </div>
                </mat-card-content>
                
                <mat-card-actions align="end">
                  <button mat-button color="primary">
                    <mat-icon>restart_alt</mat-icon>
                    Redémarrer
                  </button>
                </mat-card-actions>
              </mat-card>
              
              <mat-card class="status-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>speed</mat-icon>
                  <mat-card-title>Performance</mat-card-title>
                  <mat-card-subtitle>Utilisation des ressources</mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="resource-usage">
                    <div class="usage-item">
                      <div class="usage-header">
                        <div class="usage-label">CPU</div>
                        <div class="usage-value">{{ systemInfo.cpuUsage }}%</div>
                      </div>
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="systemInfo.cpuUsage"
                        [color]="getResourceColor(systemInfo.cpuUsage)">
                      </mat-progress-bar>
                    </div>
                    
                    <div class="usage-item">
                      <div class="usage-header">
                        <div class="usage-label">Mémoire</div>
                        <div class="usage-value">{{ systemInfo.memoryUsage }}%</div>
                      </div>
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="systemInfo.memoryUsage"
                        [color]="getResourceColor(systemInfo.memoryUsage)">
                      </mat-progress-bar>
                    </div>
                    
                    <div class="usage-item">
                      <div class="usage-header">
                        <div class="usage-label">Disque</div>
                        <div class="usage-value">{{ systemInfo.diskUsage }}%</div>
                      </div>
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="systemInfo.diskUsage"
                        [color]="getResourceColor(systemInfo.diskUsage)">
                      </mat-progress-bar>
                    </div>
                  </div>
                  
                  <div class="system-stats">
                    <div class="stat-item">
                      <mat-icon>dns</mat-icon>
                      <div class="stat-content">
                        <div class="stat-value">{{ systemInfo.databaseConnections }}</div>
                        <div class="stat-label">Connexions DB</div>
                      </div>
                    </div>
                    
                    <div class="stat-item">
                      <mat-icon>people</mat-icon>
                      <div class="stat-content">
                        <div class="stat-value">{{ systemInfo.activeUsers }}</div>
                        <div class="stat-label">Utilisateurs actifs</div>
                      </div>
                    </div>
                    
                    <div class="stat-item">
                      <mat-icon>pending_actions</mat-icon>
                      <div class="stat-content">
                        <div class="stat-value">{{ systemInfo.queuedJobs }}</div>
                        <div class="stat-label">Tâches en file</div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
                
                <mat-card-actions align="end">
                  <button mat-button color="primary">
                    <mat-icon>insights</mat-icon>
                    Plus de détails
                  </button>
                </mat-card-actions>
              </mat-card>
              
              <mat-card class="status-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>security</mat-icon>
                  <mat-card-title>Sécurité & Sauvegarde</mat-card-title>
                  <mat-card-subtitle>Protégez vos données</mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="security-status">
                    <div class="security-item">
                      <mat-icon color="primary">lock</mat-icon>
                      <div class="security-text">HTTPS activé</div>
                    </div>
                    
                    <div class="security-item">
                      <mat-icon color="primary">verified_user</mat-icon>
                      <div class="security-text">Authentification à 2 facteurs disponible</div>
                    </div>
                    
                    <div class="security-item">
                      <mat-icon color="primary">backup</mat-icon>
                      <div class="security-text">
                        Dernière sauvegarde: {{ systemInfo.lastBackup | date:'dd/MM/yyyy HH:mm' }}
                      </div>
                    </div>
                  </div>
                </mat-card-content>
                
                <mat-card-actions align="end">
                  <button mat-button color="primary">
                    <mat-icon>backup</mat-icon>
                    Sauvegarder maintenant
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
            
            <!-- Quick Actions -->
            <div class="quick-actions">
              <h2>Actions rapides</h2>
              
              <div class="actions-grid">
                <button mat-raised-button class="action-button">
                  <mat-icon>cleaning_services</mat-icon>
                  <span>Nettoyer le cache</span>
                </button>
                
                <button mat-raised-button class="action-button">
                  <mat-icon>download</mat-icon>
                  <span>Télécharger les logs</span>
                </button>
                
                <button mat-raised-button class="action-button">
                  <mat-icon>refresh</mat-icon>
                  <span>Actualiser le système</span>
                </button>
                
                <button mat-raised-button class="action-button">
                  <mat-icon>system_update</mat-icon>
                  <span>Vérifier les mises à jour</span>
                </button>
              </div>
            </div>
            
            <!-- Recent Activity -->
            <div class="recent-activity">
              <h2>Activité récente</h2>
              
              <mat-card class="activity-card">
                <mat-card-content>
                  <div class="activity-list">
                    <div class="activity-item">
                      <div class="activity-icon">
                        <mat-icon>update</mat-icon>
                      </div>
                      <div class="activity-content">
                        <div class="activity-title">Mise à jour système effectuée</div>
                        <div class="activity-details">Version 2.4.1 installée avec succès</div>
                        <div class="activity-time">Aujourd'hui, 09:45</div>
                      </div>
                    </div>
                    
                    <div class="activity-item">
                      <div class="activity-icon">
                        <mat-icon>backup</mat-icon>
                      </div>
                      <div class="activity-content">
                        <div class="activity-title">Sauvegarde automatique réalisée</div>
                        <div class="activity-details">3.2 GB sauvegardés dans le cloud</div>
                        <div class="activity-time">Aujourd'hui, 03:00</div>
                      </div>
                    </div>
                    
                    <div class="activity-item">
                      <div class="activity-icon warning">
                        <mat-icon>warning</mat-icon>
                      </div>
                      <div class="activity-content">
                        <div class="activity-title">Alerte espace disque</div>
                        <div class="activity-details">L'espace disque est tombé en dessous de 20%</div>
                        <div class="activity-time">Hier, 18:30</div>
                      </div>
                    </div>
                    
                    <div class="activity-item">
                      <div class="activity-icon">
                        <mat-icon>restart_alt</mat-icon>
                      </div>
                      <div class="activity-content">
                        <div class="activity-title">Redémarrage du serveur</div>
                        <div class="activity-details">Redémarrage planifié effectué avec succès</div>
                        <div class="activity-time">Hier, 03:15</div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
                
                <mat-card-actions align="end">
                  <button mat-button color="primary">Voir tout</button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Général">
          <!-- General Settings Tab -->
          <div class="tab-content">
            <form [formGroup]="generalSettingsForm" class="settings-form">
              <!-- Application Settings -->
              <mat-card class="settings-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>settings</mat-icon>
                  <mat-card-title>Paramètres de l'application</mat-card-title>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Nom de l'application</mat-label>
                      <input matInput formControlName="appName">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>URL de l'application</mat-label>
                      <input matInput formControlName="appUrl">
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Contact administrateur</mat-label>
                      <input matInput formControlName="adminEmail" type="email">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Fuseau horaire</mat-label>
                      <mat-select formControlName="timezone">
                        <mat-option value="Europe/Paris">Europe/Paris</mat-option>
                        <mat-option value="Europe/London">Europe/London</mat-option>
                        <mat-option value="America/New_York">America/New_York</mat-option>
                        <mat-option value="Asia/Tokyo">Asia/Tokyo</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Format de date</mat-label>
                      <mat-select formControlName="dateFormat">
                        <mat-option value="DD/MM/YYYY">DD/MM/YYYY</mat-option>
                        <mat-option value="MM/DD/YYYY">MM/DD/YYYY</mat-option>
                        <mat-option value="YYYY-MM-DD">YYYY-MM-DD</mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Devise par défaut</mat-label>
                      <mat-select formControlName="currency">
                        <mat-option value="EUR">Euro (€)</mat-option>
                        <mat-option value="USD">Dollar US ($)</mat-option>
                        <mat-option value="GBP">Livre Sterling (£)</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  
                  <h3>Options de l'interface</h3>
                  
                  <div class="form-row settings-toggles">
                    <mat-slide-toggle formControlName="enableUserRegistration">
                      Activer l'enregistrement des utilisateurs
                    </mat-slide-toggle>
                    
                    <mat-slide-toggle formControlName="enableMaintenanceMode">
                      Mode maintenance
                    </mat-slide-toggle>
                    
                    <mat-slide-toggle formControlName="showVersionNumber">
                      Afficher le numéro de version
                    </mat-slide-toggle>
                  </div>
                  
                  <h3>Thème de l'application</h3>
                  <div class="theme-switcher-container">
                    <app-theme-switcher></app-theme-switcher>
                  </div>
                </mat-card-content>
              </mat-card>
              
              <!-- Email Settings -->
              <mat-card class="settings-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>email</mat-icon>
                  <mat-card-title>Paramètres Email</mat-card-title>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Adresse d'expédition</mat-label>
                      <input matInput formControlName="emailFrom">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Nom d'expédition</mat-label>
                      <input matInput formControlName="emailFromName">
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Serveur SMTP</mat-label>
                      <input matInput formControlName="smtpHost">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Port SMTP</mat-label>
                      <input matInput formControlName="smtpPort" type="number">
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Utilisateur SMTP</mat-label>
                      <input matInput formControlName="smtpUser">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Mot de passe SMTP</mat-label>
                      <input matInput formControlName="smtpPassword" type="password">
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row settings-toggles">
                    <mat-slide-toggle formControlName="smtpEncryption">
                      Utiliser TLS/SSL
                    </mat-slide-toggle>
                    
                    <button mat-raised-button color="primary">
                      <mat-icon>send</mat-icon>
                      Tester la configuration
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
              
              <!-- Save Button -->
              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="saveGeneralSettings()">
                  <mat-icon>save</mat-icon>
                  Enregistrer les paramètres
                </button>
              </div>
            </form>
          </div>
        </mat-tab>
        
        <mat-tab label="Intégrations & API">
          <!-- Integrations and API Tab -->
          <div class="tab-content">
            <!-- API Keys Section -->
            <div class="api-keys-section">
              <div class="section-header">
                <h2>Clés API</h2>
                <button mat-mini-fab color="primary" matTooltip="Créer une nouvelle clé API">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
              
              <mat-card class="table-card">
                <table mat-table [dataSource]="apiKeys" class="api-keys-table">
                  <!-- Name Column -->
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Nom</th>
                    <td mat-cell *matCellDef="let key">{{ key.name }}</td>
                  </ng-container>
                  
                  <!-- Key Column -->
                  <ng-container matColumnDef="key">
                    <th mat-header-cell *matHeaderCellDef>Clé</th>
                    <td mat-cell *matCellDef="let key">
                      <div class="api-key-value">
                        <span>{{ maskApiKey(key.key) }}</span>
                        <button mat-icon-button matTooltip="Copier">
                          <mat-icon>content_copy</mat-icon>
                        </button>
                      </div>
                    </td>
                  </ng-container>
                  
                  <!-- Created Column -->
                  <ng-container matColumnDef="created">
                    <th mat-header-cell *matHeaderCellDef>Créée le</th>
                    <td mat-cell *matCellDef="let key">{{ key.createdAt | date:'dd/MM/yyyy' }}</td>
                  </ng-container>
                  
                  <!-- Last Used Column -->
                  <ng-container matColumnDef="lastUsed">
                    <th mat-header-cell *matHeaderCellDef>Dernière utilisation</th>
                    <td mat-cell *matCellDef="let key">
                      {{ key.lastUsed ? (key.lastUsed | date:'dd/MM/yyyy HH:mm') : 'Jamais utilisée' }}
                    </td>
                  </ng-container>
                  
                  <!-- Status Column -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let key">
                      <div class="status-indicator" [ngClass]="'api-status-' + key.status">
                        <span class="status-dot"></span>
                        <span class="status-text">{{ key.status === 'active' ? 'Active' : 'Inactive' }}</span>
                      </div>
                    </td>
                  </ng-container>
                  
                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let key">
                      <div class="action-buttons">
                        <button mat-icon-button matTooltip="Modifier les permissions" color="primary">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Révoquer" color="warn">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </td>
                  </ng-container>
                  
                  <tr mat-header-row *matHeaderRowDef="apiKeysColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: apiKeysColumns;"></tr>
                </table>
              </mat-card>
            </div>
            
            <!-- External Integrations -->
            <div class="integrations-section">
              <h2>Intégrations externes</h2>
              
              <div class="integrations-grid">
                <mat-card class="integration-card" *ngFor="let integration of integrations">
                  <div class="integration-header">
                    <div class="integration-icon" [ngClass]="'integration-' + integration.type.toLowerCase()">
                      <mat-icon>{{ getIntegrationIcon(integration.type) }}</mat-icon>
                    </div>
                    <div class="integration-title">
                      <h3>{{ integration.name }}</h3>
                      <div class="integration-status" [ngClass]="'status-' + integration.status">
                        {{ integration.status === 'connected' ? 'Connecté' : 
                           integration.status === 'disconnected' ? 'Déconnecté' : 'Erreur' }}
                      </div>
                    </div>
                  </div>
                  
                  <mat-divider></mat-divider>
                  
                  <div class="integration-content">
                    <div class="integration-info" *ngIf="integration.status === 'connected'">
                      <div class="info-item">
                        <div class="info-label">Dernière synchronisation</div>
                        <div class="info-value">{{ integration.lastSync | date:'dd/MM/yyyy HH:mm' }}</div>
                      </div>
                      
                      <div class="integration-actions">
                        <button mat-button color="primary">
                          <mat-icon>sync</mat-icon>
                          Synchroniser
                        </button>
                        <button mat-button color="primary">
                          <mat-icon>settings</mat-icon>
                          Configurer
                        </button>
                      </div>
                    </div>
                    
                    <div class="integration-connect" *ngIf="integration.status !== 'connected'">
                      <button mat-raised-button color="primary">
                        <mat-icon>link</mat-icon>
                        Connecter
                      </button>
                    </div>
                  </div>
                </mat-card>
              </div>
            </div>
            
            <!-- Webhook Settings -->
            <div class="webhooks-section">
              <div class="section-header">
                <h2>Webhooks</h2>
                <button mat-mini-fab color="primary" matTooltip="Ajouter un webhook">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
              
              <mat-expansion-panel class="webhook-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>Comment utiliser les webhooks</mat-panel-title>
                </mat-expansion-panel-header>
                
                <div class="webhook-instructions">
                  <p>Les webhooks permettent à votre application de recevoir des notifications en temps réel sur certains événements.</p>
                  <p>Pour utiliser un webhook :</p>
                  <ol>
                    <li>Cliquez sur "Ajouter un webhook"</li>
                    <li>Configurez les événements qui déclencheront le webhook</li>
                    <li>Entrez l'URL de votre endpoint qui recevra les requêtes POST</li>
                    <li>Ajoutez un secret pour valider l'authenticité des requêtes</li>
                  </ol>
                  <p>Exemple de charge utile reçue :</p>
                  <pre><code>
{
  "event": "order.created",
  "timestamp": "2025-05-11T10:30:00Z",
  "data": {
    "id": "ORD-12345",
    "customer": "Jean Dupont",
    "amount": 129.99
  }
}
                  </code></pre>
                </div>
              </mat-expansion-panel>
              
              <div class="no-webhooks-message">
                <mat-icon>webhook</mat-icon>
                <p>Aucun webhook configuré</p>
                <button mat-raised-button color="primary">
                  <mat-icon>add</mat-icon>
                  Configurer un webhook
                </button>
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Sauvegarde & Maintenance">
          <!-- Backup and Maintenance Tab -->
          <div class="tab-content">
            <!-- Backup Section -->
            <div class="backup-section">
              <mat-card class="backup-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>backup</mat-icon>
                  <mat-card-title>Configuration des sauvegardes</mat-card-title>
                  <div class="backup-status">
                    <div class="status-badge" [ngClass]="backupConfig.enabled ? 'status-enabled' : 'status-disabled'">
                      {{ backupConfig.enabled ? 'Activé' : 'Désactivé' }}
                    </div>
                  </div>
                </mat-card-header>
                
                <mat-card-content>
                  <form [formGroup]="backupForm" class="backup-form">
                    <div class="form-row settings-toggles">
                      <mat-slide-toggle formControlName="enabled">
                        Activer les sauvegardes automatiques
                      </mat-slide-toggle>
                    </div>
                    
                    <div class="form-grid" *ngIf="backupForm.get('enabled')?.value">
                      <div class="form-column">
                        <h3>Planification</h3>
                        
                        <mat-form-field appearance="outline">
                          <mat-label>Fréquence</mat-label>
                          <mat-select formControlName="schedule">
                            <mat-option value="daily">Quotidienne</mat-option>
                            <mat-option value="weekly">Hebdomadaire</mat-option>
                            <mat-option value="monthly">Mensuelle</mat-option>
                            <mat-option value="custom">Personnalisée</mat-option>
                          </mat-select>
                        </mat-form-field>
                        
                        <mat-form-field appearance="outline">
                          <mat-label>Heure</mat-label>
                          <input matInput formControlName="time" type="time">
                        </mat-form-field>
                        
                        <mat-form-field appearance="outline">
                          <mat-label>Rétention (jours)</mat-label>
                          <input matInput formControlName="retention" type="number">
                        </mat-form-field>
                      </div>
                      
                      <div class="form-column">
                        <h3>Options</h3>
                        
                        <mat-form-field appearance="outline">
                          <mat-label>Emplacement</mat-label>
                          <mat-select formControlName="location">
                            <mat-option value="local">Stockage local</mat-option>
                            <mat-option value="cloud">Cloud</mat-option>
                          </mat-select>
                        </mat-form-field>
                        
                        <div class="settings-toggles">
                          <mat-slide-toggle formControlName="includeUploads">
                            Inclure les fichiers téléchargés
                          </mat-slide-toggle>
                          
                          <mat-slide-toggle formControlName="encryptBackups">
                            Chiffrer les sauvegardes
                          </mat-slide-toggle>
                        </div>
                      </div>
                    </div>
                  </form>
                </mat-card-content>
                
                <mat-card-actions align="end">
                  <button mat-button>Annuler</button>
                  <button mat-raised-button color="primary" (click)="saveBackupSettings()">
                    <mat-icon>save</mat-icon>
                    Enregistrer
                  </button>
                </mat-card-actions>
              </mat-card>
              
              <mat-card class="backup-history-card">
                <mat-card-header>
                  <mat-card-title>Historique des sauvegardes</mat-card-title>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="backup-actions">
                    <button mat-raised-button color="primary">
                      <mat-icon>backup</mat-icon>
                      Sauvegarder maintenant
                    </button>
                    
                    <button mat-raised-button>
                      <mat-icon>restore</mat-icon>
                      Restaurer
                    </button>
                  </div>
                  
                  <div class="backup-list">
                    <div class="backup-item">
                      <div class="backup-info">
                        <div class="backup-name">backup_20250511_030000.zip</div>
                        <div class="backup-meta">
                          <span>11/05/2025 03:00</span>
                          <span>3.2 GB</span>
                          <span>Automatique</span>
                        </div>
                      </div>
                      <div class="backup-item-actions">
                        <button mat-icon-button matTooltip="Télécharger">
                          <mat-icon>download</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Restaurer">
                          <mat-icon>restore</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Supprimer" color="warn">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                    
                    <div class="backup-item">
                      <div class="backup-info">
                        <div class="backup-name">backup_20250510_030000.zip</div>
                        <div class="backup-meta">
                          <span>10/05/2025 03:00</span>
                          <span>3.1 GB</span>
                          <span>Automatique</span>
                        </div>
                      </div>
                      <div class="backup-item-actions">
                        <button mat-icon-button matTooltip="Télécharger">
                          <mat-icon>download</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Restaurer">
                          <mat-icon>restore</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Supprimer" color="warn">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                    
                    <div class="backup-item">
                      <div class="backup-info">
                        <div class="backup-name">backup_20250509_155230.zip</div>
                        <div class="backup-meta">
                          <span>09/05/2025 15:52</span>
                          <span>3.1 GB</span>
                          <span>Manuel</span>
                        </div>
                      </div>
                      <div class="backup-item-actions">
                        <button mat-icon-button matTooltip="Télécharger">
                          <mat-icon>download</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Restaurer">
                          <mat-icon>restore</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Supprimer" color="warn">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
            
            <!-- Maintenance Section -->
            <div class="maintenance-section">
              <h2>Maintenance du système</h2>
              
              <div class="maintenance-actions">
                <mat-card class="action-card">
                  <mat-card-content>
                    <div class="action-icon">
                      <mat-icon>cleaning_services</mat-icon>
                    </div>
                    <h3>Nettoyer le cache</h3>
                    <p>Supprime les fichiers temporaires et vide le cache système</p>
                    <button mat-raised-button color="primary">Nettoyer</button>
                  </mat-card-content>
                </mat-card>
                
                <mat-card class="action-card">
                  <mat-card-content>
                    <div class="action-icon">
                      <mat-icon>storage</mat-icon>
                    </div>
                    <h3>Optimiser la base de données</h3>
                    <p>Réorganise les données pour améliorer les performances</p>
                    <button mat-raised-button color="primary">Optimiser</button>
                  </mat-card-content>
                </mat-card>
                
                <mat-card class="action-card">
                  <mat-card-content>
                    <div class="action-icon">
                      <mat-icon>delete_sweep</mat-icon>
                    </div>
                    <h3>Purger les données</h3>
                    <p>Supprime les anciennes données inutilisées</p>
                    <button mat-raised-button color="primary">Purger</button>
                  </mat-card-content>
                </mat-card>
                
                <mat-card class="action-card warning">
                  <mat-card-content>
                    <div class="action-icon">
                      <mat-icon>warning</mat-icon>
                    </div>
                    <h3>Mode maintenance</h3>
                    <p>Rend l'application inaccessible pendant la maintenance</p>
                    <button mat-raised-button color="warn">Activer</button>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Logs">
          <!-- Logs Tab -->
          <div class="tab-content">
            <div class="logs-header">
              <div class="logs-filters">
                <mat-form-field appearance="outline">
                  <mat-label>Type de log</mat-label>
                  <mat-select>
                    <mat-option value="all">Tous les logs</mat-option>
                    <mat-option value="info">Info</mat-option>
                    <mat-option value="warning">Avertissement</mat-option>
                    <mat-option value="error">Erreur</mat-option>
                    <mat-option value="debug">Debug</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <mat-form-field appearance="outline">
                  <mat-label>Fichier</mat-label>
                  <mat-select>
                    <mat-option value="system">system.log</mat-option>
                    <mat-option value="access">access.log</mat-option>
                    <mat-option value="error">error.log</mat-option>
                    <mat-option value="database">database.log</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <mat-form-field appearance="outline">
                  <mat-label>Rechercher</mat-label>
                  <input matInput placeholder="Texte à rechercher">
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>
                
                <div class="filter-actions">
                  <button mat-raised-button color="primary">
                    <mat-icon>filter_alt</mat-icon>
                    Filtrer
                  </button>
                  
                  <button mat-raised-button>
                    <mat-icon>download</mat-icon>
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
            
            <mat-card class="logs-card">
              <div class="logs-viewer">
                <div class="log-line error">
                  <div class="log-time">[2025-05-11 13:45:22]</div>
                  <div class="log-level error">ERROR</div>
                  <div class="log-message">Exception: Impossible de se connecter à la base de données - connection refused</div>
                </div>
                
                <div class="log-line info">
                  <div class="log-time">[2025-05-11 13:45:20]</div>
                  <div class="log-level info">INFO</div>
                  <div class="log-message">Tentative de connexion à la base de données...</div>
                </div>
                
                <div class="log-line info">
                  <div class="log-time">[2025-05-11 13:45:10]</div>
                  <div class="log-level info">INFO</div>
                  <div class="log-message">L'utilisateur admin@example.com s'est connecté</div>
                </div>
                
                <div class="log-line warning">
                  <div class="log-time">[2025-05-11 13:40:05]</div>
                  <div class="log-level warning">WARNING</div>
                  <div class="log-message">L'espace disque disponible est inférieur à 20%</div>
                </div>
                
                <div class="log-line info">
                  <div class="log-time">[2025-05-11 13:30:00]</div>
                  <div class="log-level info">INFO</div>
                  <div class="log-message">Démarrage du système, version 2.4.1</div>
                </div>
                
                <div class="log-line debug">
                  <div class="log-time">[2025-05-11 13:29:58]</div>
                  <div class="log-level debug">DEBUG</div>
                  <div class="log-message">Chargement des configurations à partir de config.json</div>
                </div>
                
                <div class="log-line debug">
                  <div class="log-time">[2025-05-11 13:29:55]</div>
                  <div class="log-level debug">DEBUG</div>
                  <div class="log-message">Initialisation des services système</div>
                </div>
                
                <div class="log-line info">
                  <div class="log-time">[2025-05-11 03:00:01]</div>
                  <div class="log-level info">INFO</div>
                  <div class="log-message">Sauvegarde quotidienne terminée avec succès</div>
                </div>
                
                <div class="log-line info">
                  <div class="log-time">[2025-05-11 03:00:00]</div>
                  <div class="log-level info">INFO</div>
                  <div class="log-message">Démarrage de la sauvegarde quotidienne</div>
                </div>
              </div>
              
              <mat-card-actions align="end">
                <button mat-button color="primary">
                  <mat-icon>expand_more</mat-icon>
                  Charger plus
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .system-settings-container {
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
    
    .health-status {
      display: flex;
      align-items: center;
      border-radius: 50px;
      padding: 8px 16px;
      gap: 10px;
    }
    
    .health-status.status-healthy {
      background-color: rgba(76, 175, 80, 0.1);
      border: 1px solid rgba(76, 175, 80, 0.3);
    }
    
    .health-status.status-warning {
      background-color: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
    }
    
    .health-status.status-critical {
      background-color: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.3);
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .status-healthy .status-indicator mat-icon {
      color: #4CAF50;
    }
    
    .status-warning .status-indicator mat-icon {
      color: #FF9800;
    }
    
    .status-critical .status-indicator mat-icon {
      color: #F44336;
    }
    
    .status-text {
      display: flex;
      flex-direction: column;
    }
    
    .status-label {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .status-value {
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .status-healthy .status-value {
      color: #4CAF50;
    }
    
    .status-warning .status-value {
      color: #FF9800;
    }
    
    .status-critical .status-value {
      color: #F44336;
    }
    
    .settings-tabs {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
    }
    
    .tab-content {
      padding: 20px;
    }
    
    /* Overview Tab */
    .status-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .status-card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
      height: 100%;
    }
    
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 16px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      border-radius: 4px;
      background-color: rgba(var(--background-tertiary-rgb), 0.3);
    }
    
    .info-label {
      font-weight: 500;
      color: var(--text-secondary);
    }
    
    .info-value {
      color: var(--text-primary);
    }
    
    .resource-usage {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 16px;
    }
    
    .usage-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .usage-header {
      display: flex;
      justify-content: space-between;
    }
    
    .usage-label {
      font-weight: 500;
      color: var(--text-secondary);
    }
    
    .usage-value {
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .system-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border-radius: 8px;
      background-color: rgba(var(--background-tertiary-rgb), 0.3);
      flex: 1;
      margin: 0 4px;
    }
    
    .stat-item mat-icon {
      color: var(--accent-color);
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .security-status {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }
    
    .security-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      background-color: rgba(var(--background-tertiary-rgb), 0.3);
    }
    
    .security-text {
      color: var(--text-primary);
    }
    
    .quick-actions {
      margin-bottom: 30px;
    }
    
    .quick-actions h2, .recent-activity h2 {
      font-size: 20px;
      font-weight: 500;
      margin: 0 0 16px;
      color: var(--text-primary);
    }
    
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .action-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-radius: 8px;
      background-color: rgba(var(--background-secondary-rgb), 0.7);
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
      height: 100%;
    }
    
    .action-button mat-icon {
      font-size: 30px;
      height: 30px;
      width: 30px;
      margin-bottom: 10px;
      color: var(--accent-color);
    }
    
    .action-button span {
      color: var(--text-primary);
      font-weight: 500;
      text-align: center;
    }
    
    .action-button:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px var(--shadow-color);
      background-color: rgba(var(--hover-bg-rgb), 0.3);
      border-color: var(--accent-color);
    }
    
    .activity-card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
    }
    
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .activity-item {
      display: flex;
      gap: 16px;
      padding: 12px;
      border-radius: 8px;
      background-color: rgba(var(--background-tertiary-rgb), 0.3);
    }
    
    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(var(--accent-color-rgb), 0.1);
      flex-shrink: 0;
    }
    
    .activity-icon mat-icon {
      color: var(--accent-color);
    }
    
    .activity-icon.warning {
      background-color: rgba(255, 152, 0, 0.1);
    }
    
    .activity-icon.warning mat-icon {
      color: #FF9800;
    }
    
    .activity-content {
      flex: 1;
    }
    
    .activity-title {
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .activity-details {
      color: var(--text-secondary);
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .activity-time {
      color: var(--text-muted);
      font-size: 12px;
    }
    
    /* General Settings Tab */
    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    
    .settings-card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
      margin-bottom: 20px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .form-row mat-form-field {
      flex: 1;
    }
    
    .settings-toggles {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 24px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
    
    h3 {
      font-size: 16px;
      font-weight: 500;
      margin: 16px 0;
      color: var(--text-primary);
    }
    
    .theme-switcher-container {
      margin: 16px 0;
    }
    
    /* Integrations and API Tab */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .section-header h2 {
      font-size: 20px;
      font-weight: 500;
      margin: 0;
      color: var(--text-primary);
    }
    
    .table-card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
      margin-bottom: 30px;
    }
    
    .api-keys-table {
      width: 100%;
    }
    
    .api-key-value {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    .api-status-active .status-dot {
      background-color: #4CAF50;
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
    }
    
    .api-status-inactive .status-dot {
      background-color: #9E9E9E;
    }
    
    .integrations-section, .webhooks-section {
      margin-top: 30px;
    }
    
    .integrations-section h2, .webhooks-section h2 {
      font-size: 20px;
      font-weight: 500;
      margin: 0 0 16px;
      color: var(--text-primary);
    }
    
    .integrations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .integration-card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
    }
    
    .integration-header {
      display: flex;
      align-items: center;
      padding: 16px;
      gap: 16px;
    }
    
    .integration-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .integration-stripe {
      background-color: rgba(103, 58, 183, 0.1);
    }
    
    .integration-stripe mat-icon {
      color: #673AB7;
    }
    
    .integration-google {
      background-color: rgba(244, 67, 54, 0.1);
    }
    
    .integration-google mat-icon {
      color: #F44336;
    }
    
    .integration-twilio {
      background-color: rgba(33, 150, 243, 0.1);
    }
    
    .integration-twilio mat-icon {
      color: #2196F3;
    }
    
    .integration-title {
      flex: 1;
    }
    
    .integration-title h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .integration-status {
      font-size: 12px;
      border-radius: 12px;
      padding: 2px 8px;
      display: inline-block;
    }
    
    .status-connected {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }
    
    .status-disconnected {
      background-color: rgba(158, 158, 158, 0.1);
      color: #9E9E9E;
    }
    
    .status-error {
      background-color: rgba(244, 67, 54, 0.1);
      color: #F44336;
    }
    
    .integration-content {
      padding: 16px;
    }
    
    .integration-info {
      margin-bottom: 16px;
    }
    
    .integration-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    
    .integration-connect {
      display: flex;
      justify-content: center;
    }
    
    .webhook-panel {
      background: var(--card-bg);
      margin-bottom: 20px;
    }
    
    .webhook-instructions {
      color: var(--text-primary);
    }
    
    .webhook-instructions p {
      margin-bottom: 16px;
    }
    
    .webhook-instructions pre {
      background-color: rgba(var(--background-tertiary-rgb), 0.5);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    
    .webhook-instructions code {
      font-family: monospace;
      color: var(--text-primary);
    }
    
    .no-webhooks-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      text-align: center;
      background-color: rgba(var(--background-secondary-rgb), 0.5);
      border-radius: 8px;
      border: 1px dashed var(--border-color);
    }
    
    .no-webhooks-message mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      color: var(--text-secondary);
    }
    
    .no-webhooks-message p {
      color: var(--text-secondary);
      margin-bottom: 16px;
    }
    
    /* Backup and Maintenance Tab */
    .backup-card, .backup-history-card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
      margin-bottom: 20px;
    }
    
    .backup-status {
      margin-left: auto;
    }
    
    .status-badge {
      font-size: 12px;
      border-radius: 12px;
      padding: 2px 8px;
    }
    
    .status-enabled {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }
    
    .status-disabled {
      background-color: rgba(244, 67, 54, 0.1);
      color: #F44336;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .backup-actions {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .backup-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .backup-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-radius: 8px;
      background-color: rgba(var(--background-tertiary-rgb), 0.3);
    }
    
    .backup-name {
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .backup-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .backup-item-actions {
      display: flex;
      gap: 4px;
    }
    
    .maintenance-section {
      margin-top: 30px;
    }
    
    .maintenance-section h2 {
      font-size: 20px;
      font-weight: 500;
      margin: 0 0 16px;
      color: var(--text-primary);
    }
    
    .maintenance-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .action-card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
      text-align: center;
      padding: 20px;
    }
    
    .action-icon {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      background-color: rgba(var(--accent-color-rgb), 0.1);
    }
    
    .action-icon mat-icon {
      font-size: 30px;
      height: 30px;
      width: 30px;
      color: var(--accent-color);
    }
    
    .action-card h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .action-card p {
      color: var(--text-secondary);
      margin-bottom: 16px;
      height: 40px;
    }
    
    .action-card.warning .action-icon {
      background-color: rgba(244, 67, 54, 0.1);
    }
    
    .action-card.warning .action-icon mat-icon {
      color: #F44336;
    }
    
    /* Logs Tab */
    .logs-header {
      margin-bottom: 20px;
    }
    
    .logs-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-start;
    }
    
    .logs-filters mat-form-field {
      min-width: 200px;
      flex: 1;
    }
    
    .filter-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    
    .logs-card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px var(--shadow-color);
      border: 1px solid var(--border-color);
    }
    
    .logs-viewer {
      font-family: monospace;
      padding: 16px;
      background-color: rgba(var(--background-tertiary-rgb), 0.5);
      max-height: 500px;
      overflow-y: auto;
    }
    
    .log-line {
      display: flex;
      padding: 4px 0;
      border-bottom: 1px solid rgba(var(--border-color-rgb), 0.3);
    }
    
    .log-time {
      width: 180px;
      color: var(--text-secondary);
    }
    
    .log-level {
      width: 80px;
      font-weight: 700;
    }
    
    .log-level.info {
      color: #2196F3;
    }
    
    .log-level.warning {
      color: #FF9800;
    }
    
    .log-level.error {
      color: #F44336;
    }
    
    .log-level.debug {
      color: #9E9E9E;
    }
    
    .log-message {
      flex: 1;
      color: var(--text-primary);
    }
    
    /* Responsive Adjustments */
    @media (max-width: 1200px) {
      .status-cards {
        grid-template-columns: 1fr;
      }
      
      .integrations-grid {
        grid-template-columns: 1fr;
      }
      
      .maintenance-actions {
        grid-template-columns: 1fr 1fr;
      }
    }
    
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
      }
      
      .maintenance-actions {
        grid-template-columns: 1fr;
      }
      
      .logs-viewer {
        font-size: 12px;
      }
      
      .log-time {
        width: 120px;
      }
    }
  `]
})
export class SystemSettingsComponent implements OnInit {
  isLoading = false;
  
  // System info
  systemInfo: SystemInfo = {
    version: '2.4.1',
    uptime: '10 jours, 7 heures',
    serverTime: new Date(),
    nodeVersion: '16.14.0',
    environment: 'Production',
    cpuUsage: 25,
    memoryUsage: 60,
    diskUsage: 85,
    databaseConnections: 12,
    activeUsers: 45,
    queuedJobs: 3,
    lastBackup: new Date('2025-05-11T03:00:00'),
    status: 'healthy'
  };
  
  // API keys
  apiKeys: ApiKeyInfo[] = [
    {
      id: '1',
      name: 'Application Web',
      key: 'sk_live_abcdef1234567890',
      createdAt: new Date('2025-03-15'),
      lastUsed: new Date('2025-05-11T10:30:00'),
      permissions: ['read:orders', 'write:orders', 'read:users'],
      status: 'active'
    },
    {
      id: '2',
      name: 'Application Mobile',
      key: 'sk_live_qwertyuiop123456',
      createdAt: new Date('2025-03-20'),
      lastUsed: new Date('2025-05-11T09:45:00'),
      permissions: ['read:orders', 'read:users', 'read:medicines'],
      status: 'active'
    },
    {
      id: '3',
      name: 'Intégration Analytics',
      key: 'sk_live_zxcvbnm1234567',
      createdAt: new Date('2025-04-10'),
      permissions: ['read:orders', 'read:medicines', 'read:statistics'],
      status: 'inactive'
    }
  ];
  apiKeysColumns = ['name', 'key', 'created', 'lastUsed', 'status', 'actions'];
  
  // Integrations
  integrations: IntegrationInfo[] = [
    {
      id: '1',
      name: 'Stripe',
      type: 'stripe',
      status: 'connected',
      lastSync: new Date('2025-05-11T12:30:00'),
      config: {
        apiKey: 'sk_live_***************',
        webhookSecret: 'whsec_***************'
      }
    },
    {
      id: '2',
      name: 'Brevo (SendinBlue)',
      type: 'brevo',
      status: 'connected',
      lastSync: new Date('2025-05-11T11:15:00'),
      config: {
        apiKey: 'xkeysib_***************'
      }
    },
    {
      id: '3',
      name: 'Google Analytics',
      type: 'google',
      status: 'error',
      lastSync: new Date('2025-05-10T15:20:00'),
      config: {
        clientId: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
        clientSecret: 'GOCSPX-***************'
      }
    },
    {
      id: '4',
      name: 'Twilio',
      type: 'twilio',
      status: 'disconnected',
      config: {}
    }
  ];
  
  // Backup config
  backupConfig: BackupConfig = {
    enabled: true,
    schedule: 'daily',
    time: '03:00',
    retention: 14,
    location: 'cloud',
    includeUploads: true,
    encryptBackups: true
  };
  
  // Forms
  generalSettingsForm: FormGroup;
  backupForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.generalSettingsForm = this.createGeneralSettingsForm();
    this.backupForm = this.createBackupForm();
  }

  ngOnInit(): void {
    // Simulate loading
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      
      // Update server time periodically
      setInterval(() => {
        this.systemInfo.serverTime = new Date();
      }, 1000);
    }, 1500);
  }
  
  createGeneralSettingsForm(): FormGroup {
    return this.fb.group({
      appName: ['MediDelivery'],
      appUrl: ['https://medi-delivery.com'],
      adminEmail: ['admin@example.com'],
      timezone: ['Europe/Paris'],
      dateFormat: ['DD/MM/YYYY'],
      currency: ['EUR'],
      enableUserRegistration: [true],
      enableMaintenanceMode: [false],
      showVersionNumber: [true],
      emailFrom: ['no-reply@medi-delivery.com'],
      emailFromName: ['MediDelivery'],
      smtpHost: ['smtp.mailserver.com'],
      smtpPort: [587],
      smtpUser: ['smtp-user'],
      smtpPassword: ['********'],
      smtpEncryption: [true]
    });
  }
  
  createBackupForm(): FormGroup {
    return this.fb.group({
      enabled: [this.backupConfig.enabled],
      schedule: [this.backupConfig.schedule],
      time: [this.backupConfig.time],
      retention: [this.backupConfig.retention],
      location: [this.backupConfig.location],
      includeUploads: [this.backupConfig.includeUploads],
      encryptBackups: [this.backupConfig.encryptBackups]
    });
  }
  
  getResourceColor(value: number): 'primary' | 'accent' | 'warn' {
    if (value < 60) {
      return 'primary';
    } else if (value < 80) {
      return 'accent';
    } else {
      return 'warn';
    }
  }
  
  saveGeneralSettings(): void {
    if (this.generalSettingsForm.valid) {
      console.log('Saving general settings:', this.generalSettingsForm.value);
    }
  }
  
  saveBackupSettings(): void {
    if (this.backupForm.valid) {
      this.backupConfig = this.backupForm.value;
      console.log('Saving backup settings:', this.backupConfig);
    }
  }
  
  maskApiKey(key: string): string {
    const prefix = key.substring(0, 7);
    const suffix = key.substring(key.length - 4);
    return `${prefix}...${suffix}`;
  }
  
  getIntegrationIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'stripe':
        return 'payment';
      case 'google':
        return 'analytics';
      case 'brevo':
        return 'mail';
      case 'twilio':
        return 'sms';
      default:
        return 'extension';
    }
  }
}