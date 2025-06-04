import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StockService } from '../../../core/services/api/stock.service';
import { StockAlert } from '../../../core/models/stock.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-stock-alerts-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="stock-alerts-card">
      <mat-card-header>
        <mat-card-title>
          <div class="header-with-icon">
            <mat-icon color="warn">warning</mat-icon>
            Alertes de stock
          </div>
        </mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <div class="loading-container" *ngIf="isLoading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
        
        <div class="no-alerts" *ngIf="!isLoading && alerts.length === 0">
          <mat-icon color="primary">check_circle</mat-icon>
          <p>Aucune alerte de stock pour le moment</p>
        </div>
        
        <div class="alerts-list" *ngIf="!isLoading && alerts.length > 0">
          <div class="alert-item" *ngFor="let alert of alerts.slice(0, maxAlertsToShow)">
            <div class="alert-content">
              <div class="alert-type-badge" [ngClass]="{
                'low-stock': alert.type === 'LOW',
                'expired': alert.type === 'EXPIRED',
                'expiring-soon': alert.type === 'EXPIRING_SOON'
              }">
                <mat-icon *ngIf="alert.type === 'LOW'">inventory</mat-icon>
                <mat-icon *ngIf="alert.type === 'EXPIRED'">block</mat-icon>
                <mat-icon *ngIf="alert.type === 'EXPIRING_SOON'">schedule</mat-icon>
                {{ getAlertTypeLabel(alert.type) }}
              </div>
              
              <div class="alert-details">
                <h4>{{ alert.medicine.name }}</h4>
                <p>Pharmacie: {{ alert.pharmacy.name }}</p>
                <p *ngIf="alert.type === 'LOW'">
                  <strong>Stock actuel:</strong> {{ alert.currentQuantity }} / 
                  <strong>Seuil:</strong> {{ alert.reorderLevel }}
                </p>
                <p *ngIf="alert.type === 'EXPIRED' && alert.expiryDate">
                  <strong>Expiré le:</strong> {{ alert.expiryDate | date:'dd/MM/yyyy' }}
                </p>
                <p *ngIf="alert.type === 'EXPIRING_SOON' && alert.daysUntilExpiry">
                  <strong>Expire dans:</strong> {{ alert.daysUntilExpiry }} jours
                </p>
              </div>
            </div>
            
            <div class="alert-actions">
              <button mat-stroked-button color="primary" [routerLink]="['/stock/pharmacy', alert.pharmacy.id]">
                <mat-icon>visibility</mat-icon>
                Voir le stock
              </button>
            </div>
          </div>
          
          <div class="show-more" *ngIf="alerts.length > maxAlertsToShow">
            <button mat-button color="primary" [routerLink]="['/stock']">
              Voir toutes les alertes ({{ alerts.length }})
            </button>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .stock-alerts-card {
      height: 100%;
    }
    
    .header-with-icon {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    
    .no-alerts {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      color: #666;
    }
    
    .no-alerts mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 10px;
    }
    
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 350px;
      overflow-y: auto;
    }
    
    .alert-item {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background-color: #fafafa;
    }
    
    .alert-content {
      display: flex;
      gap: 12px;
      flex: 1;
    }
    
    .alert-type-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border-radius: 4px;
      min-width: 80px;
      text-align: center;
      font-size: 12px;
      font-weight: bold;
    }
    
    .alert-type-badge mat-icon {
      margin-bottom: 4px;
    }
    
    .low-stock {
      background-color: #fff3e0;
      color: #e65100;
    }
    
    .expired {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .expiring-soon {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .alert-details {
      flex: 1;
    }
    
    .alert-details h4 {
      margin: 0 0 5px;
      font-weight: 500;
    }
    
    .alert-details p {
      margin: 3px 0;
      font-size: 14px;
    }
    
    .alert-actions {
      display: flex;
      align-items: center;
    }
    
    .show-more {
      display: flex;
      justify-content: center;
      margin-top: 10px;
    }
  `]
})
export class StockAlertsDashboardComponent implements OnInit {
  alerts: StockAlert[] = [];
  isLoading = true;
  maxAlertsToShow = 5;
  isPharmacyAdmin = false;
  currentPharmacyId?: number;

  constructor(
    private stockService: StockService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadAlerts();
  }

  checkUserRole(): void {
    const user = this.authService.currentUser;
    if (user) {
      // Check if user is pharmacy admin or staff and get their pharmacy ID
      this.isPharmacyAdmin = user.role === 'PHARMACY_ADMIN' || user.role === 'PHARMACY_STAFF';
    }
  }

  loadAlerts(): void {
    this.isLoading = true;
    
    // If user is pharmacy admin/staff, only show their pharmacy's alerts
    // Otherwise show all alerts (for super admin/admin)
    if (this.isPharmacyAdmin && this.currentPharmacyId) {
      this.stockService.getStockAlerts(this.currentPharmacyId).subscribe({
        next: (data) => {
          this.alerts = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading stock alerts', error);
          this.isLoading = false;
        }
      });
    } else {
      this.stockService.getAllStockAlerts().subscribe({
        next: (data) => {
          this.alerts = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading stock alerts', error);
          this.isLoading = false;
        }
      });
    }
  }

  getAlertTypeLabel(type: string): string {
    switch (type) {
      case 'LOW':
        return 'Stock bas';
      case 'EXPIRED':
        return 'Expiré';
      case 'EXPIRING_SOON':
        return 'Expire bientôt';
      default:
        return type;
    }
  }
}
