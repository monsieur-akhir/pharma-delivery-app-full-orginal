import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <div class="deliveries-container">
      <h1 class="page-title">Suivi des Livraisons</h1>
      
      <div class="delivery-stats">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon active-icon">
              <mat-icon>local_shipping</mat-icon>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ activeDeliveries }}</h3>
              <p class="stat-label">Livraisons en cours</p>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon completed-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ completedToday }}</h3>
              <p class="stat-label">Livraisons complétées aujourd'hui</p>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon time-icon">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ avgDeliveryTime }}</h3>
              <p class="stat-label">Temps moyen de livraison</p>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon delayed-icon">
              <mat-icon>error</mat-icon>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ delayedDeliveries }}</h3>
              <p class="stat-label">Livraisons en retard</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div class="deliveries-table-container">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Livraisons actives</mat-card-title>
            <div class="header-actions">
              <button mat-button color="primary">
                <mat-icon>filter_list</mat-icon> Filtrer
              </button>
              <button mat-button color="primary">
                <mat-icon>sort</mat-icon> Trier
              </button>
              <button mat-flat-button color="primary">
                <mat-icon>refresh</mat-icon> Actualiser
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="deliveries" class="deliveries-table">
              <!-- ID Column -->
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let delivery">{{ delivery.id }}</td>
              </ng-container>
              
              <!-- Pharmacy Column -->
              <ng-container matColumnDef="pharmacy">
                <th mat-header-cell *matHeaderCellDef>Pharmacie</th>
                <td mat-cell *matCellDef="let delivery">{{ delivery.pharmacy }}</td>
              </ng-container>
              
              <!-- Customer Column -->
              <ng-container matColumnDef="customer">
                <th mat-header-cell *matHeaderCellDef>Client</th>
                <td mat-cell *matCellDef="let delivery">{{ delivery.customer }}</td>
              </ng-container>
              
              <!-- Driver Column -->
              <ng-container matColumnDef="driver">
                <th mat-header-cell *matHeaderCellDef>Livreur</th>
                <td mat-cell *matCellDef="let delivery">{{ delivery.driver }}</td>
              </ng-container>
              
              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let delivery">
                  <span class="status-chip" [ngClass]="'status-' + delivery.statusClass">
                    {{ delivery.status }}
                  </span>
                </td>
              </ng-container>
              
              <!-- Time Column -->
              <ng-container matColumnDef="time">
                <th mat-header-cell *matHeaderCellDef>Heure estimée</th>
                <td mat-cell *matCellDef="let delivery">
                  <span [ngClass]="{'delayed-time': delivery.isDelayed}">
                    {{ delivery.estimatedTime }}
                  </span>
                  <span *ngIf="delivery.isDelayed" class="delay-badge">
                    En retard
                  </span>
                </td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let delivery">
                  <button mat-icon-button color="primary" matTooltip="Voir sur la carte">
                    <mat-icon>map</mat-icon>
                  </button>
                  <button mat-icon-button color="primary" matTooltip="Détails">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item>
                      <mat-icon>call</mat-icon>
                      <span>Contacter le livreur</span>
                    </button>
                    <button mat-menu-item>
                      <mat-icon>message</mat-icon>
                      <span>Message au client</span>
                    </button>
                    <button mat-menu-item>
                      <mat-icon>assignment</mat-icon>
                      <span>Détails de la commande</span>
                    </button>
                    <button mat-menu-item *ngIf="delivery.statusClass !== 'completed'" class="warn-menu-item">
                      <mat-icon>cancel</mat-icon>
                      <span>Annuler la livraison</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            
            <mat-paginator [pageSize]="5" [pageSizeOptions]="[5, 10, 25]"></mat-paginator>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div class="delivery-map-container">
        <mat-card class="map-card">
          <mat-card-header>
            <mat-card-title>Carte des livraisons</mat-card-title>
            <button mat-button color="primary">Plein écran</button>
          </mat-card-header>
          <mat-card-content>
            <div class="map-placeholder">
              <mat-icon class="map-icon">map</mat-icon>
              <p>La carte des livraisons sera affichée ici</p>
              <p class="map-note">Cette fonctionnalité utilisera l'API Geolocation pour le suivi en temps réel</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .deliveries-container {
      padding: 20px;
    }
    
    .page-title {
      margin-bottom: 24px;
      color: #333;
      font-weight: 500;
    }
    
    .delivery-stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 16px;
    }
    
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      margin-right: 16px;
    }
    
    .stat-icon mat-icon {
      font-size: 30px;
      width: 30px;
      height: 30px;
      color: white;
    }
    
    .active-icon {
      background-color: #1976d2;
    }
    
    .completed-icon {
      background-color: #43a047;
    }
    
    .time-icon {
      background-color: #7e57c2;
    }
    
    .delayed-icon {
      background-color: #e53935;
    }
    
    .stat-content {
      flex: 1;
    }
    
    .stat-value {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    
    .stat-label {
      margin: 4px 0 0;
      color: #666;
      font-size: 14px;
    }
    
    .deliveries-table-container {
      margin-bottom: 24px;
    }
    
    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    .deliveries-table {
      width: 100%;
    }
    
    .status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-picked {
      background-color: #e3f2fd;
      color: #1976d2;
    }
    
    .status-transit {
      background-color: #fff3e0;
      color: #f57c00;
    }
    
    .status-delivered {
      background-color: #e8f5e9;
      color: #43a047;
    }
    
    .status-completed {
      background-color: #e0f2f1;
      color: #00897b;
    }
    
    .status-cancelled {
      background-color: #ffebee;
      color: #e53935;
    }
    
    .delayed-time {
      color: #e53935;
      font-weight: 500;
    }
    
    .delay-badge {
      background-color: #ffebee;
      color: #e53935;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 8px;
    }
    
    .warn-menu-item {
      color: #e53935;
    }
    
    .delivery-map-container {
      margin-bottom: 24px;
    }
    
    .map-card {
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .map-placeholder {
      height: 400px;
      background-color: #f5f5f5;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #757575;
    }
    
    .map-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #bdbdbd;
      margin-bottom: 16px;
    }
    
    .map-note {
      font-size: 12px;
      color: #9e9e9e;
      margin-top: 8px;
    }
    
    @media (max-width: 768px) {
      .delivery-stats {
        grid-template-columns: 1fr;
      }
      
      mat-card-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .header-actions {
        margin-top: 12px;
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class DeliveriesComponent implements OnInit {
  activeDeliveries = 24;
  completedToday = 37;
  avgDeliveryTime = '28 min';
  delayedDeliveries = 3;
  
  displayedColumns: string[] = ['id', 'pharmacy', 'customer', 'driver', 'status', 'time', 'actions'];
  
  deliveries = [
    {
      id: 'DEL-2023-001',
      pharmacy: 'Pharmacie Centrale',
      customer: 'Jean Dupont',
      driver: 'Michel Blanc',
      status: 'En livraison',
      statusClass: 'transit',
      estimatedTime: '14:30',
      isDelayed: false
    },
    {
      id: 'DEL-2023-002',
      pharmacy: 'Pharmacie du Marché',
      customer: 'Marie Lambert',
      driver: 'Sophie Martin',
      status: 'En préparation',
      statusClass: 'picked',
      estimatedTime: '14:45',
      isDelayed: false
    },
    {
      id: 'DEL-2023-003',
      pharmacy: 'Pharmacie Saint-Louis',
      customer: 'Paul Durand',
      driver: 'Lucas Petit',
      status: 'Livré',
      statusClass: 'delivered',
      estimatedTime: '14:15',
      isDelayed: false
    },
    {
      id: 'DEL-2023-004',
      pharmacy: 'Pharmacie Moderne',
      customer: 'Sophie Moreau',
      driver: 'Thomas Dubois',
      status: 'En livraison',
      statusClass: 'transit',
      estimatedTime: '14:00',
      isDelayed: true
    },
    {
      id: 'DEL-2023-005',
      pharmacy: 'Pharmacie des Alpes',
      customer: 'Luc Martin',
      driver: 'Julie Leroy',
      status: 'Terminé',
      statusClass: 'completed',
      estimatedTime: '13:30',
      isDelayed: false
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}