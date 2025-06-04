import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="settings-container">
      <h1 class="page-title">Paramètres du Système</h1>
      
      <mat-tab-group>
        <mat-tab label="Paramètres Généraux">
          <div class="tab-content">
            <form [formGroup]="generalSettingsForm" (ngSubmit)="saveGeneralSettings()">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Paramètres de l'Application</mat-card-title>
                  <mat-card-subtitle>Configurez les paramètres généraux de l'application</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Nom de l'Application</mat-label>
                      <input matInput formControlName="appName">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Fuseau Horaire</mat-label>
                      <mat-select formControlName="timezone">
                        <mat-option value="Europe/Paris">Europe/Paris</mat-option>
                        <mat-option value="UTC">UTC</mat-option>
                        <mat-option value="America/New_York">America/New_York</mat-option>
                        <mat-option value="Africa/Dakar">Africa/Dakar</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Langue par Défaut</mat-label>
                      <mat-select formControlName="defaultLanguage">
                        <mat-option value="fr">Français</mat-option>
                        <mat-option value="en">Anglais</mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Format de Date</mat-label>
                      <mat-select formControlName="dateFormat">
                        <mat-option value="DD/MM/YYYY">DD/MM/YYYY</mat-option>
                        <mat-option value="MM/DD/YYYY">MM/DD/YYYY</mat-option>
                        <mat-option value="YYYY-MM-DD">YYYY-MM-DD</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  
                  <div class="toggle-options">
                    <div class="toggle-option">
                      <mat-slide-toggle formControlName="enableNotifications">
                        Activer les notifications
                      </mat-slide-toggle>
                      <span class="option-description">
                        Envoyer des notifications par email et SMS
                      </span>
                    </div>
                    
                    <div class="toggle-option">
                      <mat-slide-toggle formControlName="enableLocationTracking">
                        Activer le suivi de localisation en temps réel
                      </mat-slide-toggle>
                      <span class="option-description">
                        Suivre la position des livreurs en temps réel
                      </span>
                    </div>
                    
                    <div class="toggle-option">
                      <mat-slide-toggle formControlName="enableAnalytics">
                        Activer les analytiques
                      </mat-slide-toggle>
                      <span class="option-description">
                        Collecter des données anonymisées pour améliorer l'application
                      </span>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-button type="button" (click)="resetGeneralForm()">Réinitialiser</button>
                  <button mat-raised-button color="primary" type="submit">Enregistrer</button>
                </mat-card-actions>
              </mat-card>
            </form>
          </div>
        </mat-tab>
        
        <mat-tab label="Sécurité et Authentification">
          <div class="tab-content">
            <form [formGroup]="securitySettingsForm" (ngSubmit)="saveSecuritySettings()">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Paramètres de Sécurité</mat-card-title>
                  <mat-card-subtitle>Configurez les options de sécurité et d'authentification</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Durée de session (minutes)</mat-label>
                      <input matInput type="number" formControlName="sessionDuration">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Durée de validité OTP (minutes)</mat-label>
                      <input matInput type="number" formControlName="otpValidityDuration">
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Tentatives max. de connexion</mat-label>
                      <input matInput type="number" formControlName="maxLoginAttempts">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Durée de blocage (minutes)</mat-label>
                      <input matInput type="number" formControlName="lockoutDuration">
                    </mat-form-field>
                  </div>
                  
                  <div class="toggle-options">
                    <div class="toggle-option">
                      <mat-slide-toggle formControlName="requireTwoFactor">
                        Authentification à deux facteurs
                      </mat-slide-toggle>
                      <span class="option-description">
                        Exiger l'authentification à deux facteurs pour tous les utilisateurs
                      </span>
                    </div>
                    
                    <div class="toggle-option">
                      <mat-slide-toggle formControlName="enablePasswordComplexity">
                        Exiger des mots de passe complexes
                      </mat-slide-toggle>
                      <span class="option-description">
                        Nécessite des mots de passe avec des lettres, des chiffres et des caractères spéciaux
                      </span>
                    </div>
                    
                    <div class="toggle-option">
                      <mat-slide-toggle formControlName="enableIpBlocking">
                        Bloquer les IP suspectes
                      </mat-slide-toggle>
                      <span class="option-description">
                        Bloquer automatiquement les IP avec trop de tentatives échouées
                      </span>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-button type="button" (click)="resetSecurityForm()">Réinitialiser</button>
                  <button mat-raised-button color="primary" type="submit">Enregistrer</button>
                </mat-card-actions>
              </mat-card>
            </form>
          </div>
        </mat-tab>
        
        <mat-tab label="Maintenance">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Informations Système</mat-card-title>
                <mat-card-subtitle>Statut et informations système</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="system-info-grid">
                  <div class="info-item">
                    <div class="info-label">Version API</div>
                    <div class="info-value">{{ systemInfo.apiVersion }}</div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Version Base de Données</div>
                    <div class="info-value">{{ systemInfo.dbVersion }}</div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Utilisation CPU</div>
                    <div class="info-value">
                      {{ systemInfo.cpuUsage }}%
                      <mat-progress-bar mode="determinate" [value]="systemInfo.cpuUsage" [color]="getCpuLoadColor()"></mat-progress-bar>
                    </div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Utilisation Mémoire</div>
                    <div class="info-value">
                      {{ systemInfo.memoryUsage }}%
                      <mat-progress-bar mode="determinate" [value]="systemInfo.memoryUsage" [color]="getMemoryLoadColor()"></mat-progress-bar>
                    </div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Uptime</div>
                    <div class="info-value">{{ systemInfo.uptime }}</div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Statut BDD</div>
                    <div class="info-value">
                      <span class="status-indicator" [ngClass]="{'status-ok': systemInfo.dbStatus === 'OK'}"></span>
                      {{ systemInfo.dbStatus }}
                    </div>
                  </div>
                </div>
                
                <mat-divider class="section-divider"></mat-divider>
                
                <div class="maintenance-actions">
                  <h3>Actions de Maintenance</h3>
                  
                  <div class="action-buttons">
                    <button mat-raised-button color="primary" (click)="clearCache()">
                      <mat-icon>cleaning_services</mat-icon>
                      Vider le Cache
                    </button>
                    
                    <button mat-raised-button color="primary" (click)="backupDatabase()">
                      <mat-icon>backup</mat-icon>
                      Sauvegarder la BDD
                    </button>
                    
                    <button mat-raised-button color="warn" (click)="restartServices()">
                      <mat-icon>refresh</mat-icon>
                      Redémarrer les Services
                    </button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 20px;
    }
    
    .page-title {
      margin-bottom: 24px;
      color: #333;
      font-weight: 500;
    }
    
    .tab-content {
      padding: 24px 0;
    }
    
    mat-card {
      border-radius: 8px;
      margin-bottom: 24px;
    }
    
    mat-card-header {
      margin-bottom: 16px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    mat-form-field {
      flex: 1;
    }
    
    .toggle-options {
      margin-top: 24px;
    }
    
    .toggle-option {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;
    }
    
    .option-description {
      margin-left: 48px;
      font-size: 12px;
      color: #666;
    }
    
    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 16px 16px;
    }
    
    .system-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .info-item {
      padding: 12px;
      background-color: #f5f7fa;
      border-radius: 8px;
    }
    
    .info-label {
      font-size: 12px;
      font-weight: 500;
      color: #666;
      margin-bottom: 8px;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 500;
      color: #333;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 8px;
      background-color: #f44336;
    }
    
    .status-indicator.status-ok {
      background-color: #4caf50;
    }
    
    .section-divider {
      margin: 24px 0;
    }
    
    .maintenance-actions h3 {
      margin-bottom: 16px;
      font-weight: 500;
      color: #333;
    }
    
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }
      
      .system-info-grid {
        grid-template-columns: 1fr;
      }
      
      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  generalSettingsForm: FormGroup;
  securitySettingsForm: FormGroup;
  
  systemInfo = {
    apiVersion: 'v1.2.3',
    dbVersion: 'PostgreSQL 14.2',
    cpuUsage: 32,
    memoryUsage: 64,
    uptime: '3 jours, 12 heures',
    dbStatus: 'OK'
  };
  
  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.generalSettingsForm = this.fb.group({
      appName: ['Medi-Delivery Admin', Validators.required],
      timezone: ['Europe/Paris', Validators.required],
      defaultLanguage: ['fr', Validators.required],
      dateFormat: ['DD/MM/YYYY', Validators.required],
      enableNotifications: [true],
      enableLocationTracking: [true],
      enableAnalytics: [false]
    });
    
    this.securitySettingsForm = this.fb.group({
      sessionDuration: [60, [Validators.required, Validators.min(5), Validators.max(1440)]],
      otpValidityDuration: [10, [Validators.required, Validators.min(1), Validators.max(60)]],
      maxLoginAttempts: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      lockoutDuration: [30, [Validators.required, Validators.min(5), Validators.max(1440)]],
      requireTwoFactor: [true],
      enablePasswordComplexity: [true],
      enableIpBlocking: [true]
    });
  }

  ngOnInit(): void {
  }
  
  saveGeneralSettings(): void {
    if (this.generalSettingsForm.valid) {
      // Ici, on enverrait les données au backend pour sauvegarde
      this.snackBar.open('Paramètres généraux enregistrés avec succès', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }
  
  saveSecuritySettings(): void {
    if (this.securitySettingsForm.valid) {
      // Ici, on enverrait les données au backend pour sauvegarde
      this.snackBar.open('Paramètres de sécurité enregistrés avec succès', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }
  
  resetGeneralForm(): void {
    this.generalSettingsForm.reset({
      appName: 'Medi-Delivery Admin',
      timezone: 'Europe/Paris',
      defaultLanguage: 'fr',
      dateFormat: 'DD/MM/YYYY',
      enableNotifications: true,
      enableLocationTracking: true,
      enableAnalytics: false
    });
  }
  
  resetSecurityForm(): void {
    this.securitySettingsForm.reset({
      sessionDuration: 60,
      otpValidityDuration: 10,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      requireTwoFactor: true,
      enablePasswordComplexity: true,
      enableIpBlocking: true
    });
  }
  
  clearCache(): void {
    // Simulation d'un appel API pour vider le cache
    this.snackBar.open('Cache vidé avec succès', 'Fermer', {
      duration: 3000
    });
  }
  
  backupDatabase(): void {
    // Simulation d'un appel API pour sauvegarder la BDD
    this.snackBar.open('Sauvegarde de la base de données en cours...', 'Fermer', {
      duration: 3000
    });
  }
  
  restartServices(): void {
    // Simulation d'un appel API pour redémarrer les services
    this.snackBar.open('Redémarrage des services en cours...', 'Fermer', {
      duration: 3000
    });
  }
  
  getCpuLoadColor(): string {
    return this.systemInfo.cpuUsage > 80 ? 'warn' : 
           this.systemInfo.cpuUsage > 60 ? 'accent' : 'primary';
  }
  
  getMemoryLoadColor(): string {
    return this.systemInfo.memoryUsage > 80 ? 'warn' : 
           this.systemInfo.memoryUsage > 60 ? 'accent' : 'primary';
  }
}