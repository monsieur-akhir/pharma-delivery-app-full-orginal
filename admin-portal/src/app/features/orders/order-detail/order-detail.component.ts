import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OrderService } from '../../../core/services/api/order.service';
import { Order } from '../../../shared/models/order.model';
import { DeliveryPersonAssignDialogComponent } from '../delivery-person-assign-dialog/delivery-person-assign-dialog.component';
import { InvoiceDialogComponent } from '../invoice-dialog/invoice-dialog.component';

@Component({
  selector: 'app-order-detail',
  template: `
    <div class="order-detail-container">
      <div class="back-button">
        <button mat-button (click)="navigateBack()">
          <mat-icon>arrow_back</mat-icon> Retour aux commandes
        </button>
      </div>
      
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <div class="order-not-found" *ngIf="!isLoading && !order">
        <mat-card>
          <mat-card-content>
            <p>La commande #{{ orderId }} n'a pas été trouvée.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" (click)="navigateBack()">Retour à la liste</button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <div class="order-details" *ngIf="!isLoading && order">
        <h1>Détails de la Commande #{{ order.id }}</h1>
        
        <div class="order-grid">
          <!-- Information générale -->
          <mat-card class="order-info-card">
            <mat-card-header>
              <mat-card-title>Informations Générales</mat-card-title>
            </mat-card-header>
            <mat-divider></mat-divider>
            <mat-card-content>
              <div class="info-row">
                <span class="label">Date de commande:</span>
                <span class="value">{{ order.createdAt | date:'dd/MM/yyyy à HH:mm' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Statut de la commande:</span>
                <span class="value">
                  <mat-chip [ngClass]="getStatusClass(order.status)">{{ getStatusLabel(order.status) }}</mat-chip>
                </span>
              </div>
              <div class="info-row">
                <span class="label">Client ID:</span>
                <span class="value">{{ order.userId }}</span>
              </div>
              <div class="info-row">
                <span class="label">Pharmacie ID:</span>
                <span class="value">{{ order.pharmacyId }}</span>
              </div>
              <div class="info-row">
                <span class="label">Montant total:</span>
                <span class="value">{{ order.totalPrice | currency:'EUR' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Méthode de paiement:</span>
                <span class="value">{{ order.paymentMethod }}</span>
              </div>
              <div class="info-row">
                <span class="label">Statut du paiement:</span>
                <span class="value">
                  <mat-chip [ngClass]="getPaymentStatusClass(order.paymentStatus)">
                    {{ getPaymentStatusLabel(order.paymentStatus) }}
                  </mat-chip>
                </span>
              </div>
            </mat-card-content>
          </mat-card>
          
          <!-- Adresse de livraison -->
          <mat-card class="delivery-address-card">
            <mat-card-header>
              <mat-card-title>Adresse de livraison</mat-card-title>
            </mat-card-header>
            <mat-divider></mat-divider>
            <mat-card-content>
              <p class="address">{{ order.deliveryAddress }}</p>
              
              <div class="map-placeholder" *ngIf="order.deliveryCoordinates">
                <div class="coordinates">
                  Coordonnées GPS:
                  <br>Lat: {{ order.deliveryCoordinates.lat }}
                  <br>Lng: {{ order.deliveryCoordinates.lng }}
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          
          <!-- Gestion du statut -->
          <mat-card class="status-management-card">
            <mat-card-header>
              <mat-card-title>Gestion de la commande</mat-card-title>
            </mat-card-header>
            <mat-divider></mat-divider>
            <mat-card-content>
              <mat-form-field appearance="fill" class="status-select">
                <mat-label>Changer le statut</mat-label>
                <mat-select [(ngModel)]="selectedStatus" [disabled]="isUpdatingStatus">
                  <mat-option value="pending">En attente</mat-option>
                  <mat-option value="processing">En traitement</mat-option>
                  <mat-option value="completed">Terminée</mat-option>
                  <mat-option value="delivered">Livrée</mat-option>
                  <mat-option value="cancelled">Annulée</mat-option>
                </mat-select>
              </mat-form-field>
              
              <button mat-raised-button color="primary" 
                      [disabled]="selectedStatus === order.status || isUpdatingStatus"
                      (click)="updateOrderStatus()">
                <mat-icon>update</mat-icon>
                Mettre à jour le statut
              </button>
              
              <button mat-raised-button color="accent" class="assign-button" 
                      *ngIf="canBeAssigned(order)"
                      (click)="openAssignDeliveryPersonDialog()">
                <mat-icon>person_add</mat-icon>
                Assigner un livreur
              </button>
              
              <div class="action-buttons">
                <button mat-button color="warn" 
                        *ngIf="order.status !== 'cancelled'"
                        (click)="cancelOrder()">
                  <mat-icon>cancel</mat-icon>
                  Annuler la commande
                </button>
                
                <button mat-button color="primary" (click)="openInvoiceDialog()">
                  <mat-icon>receipt</mat-icon>
                  Générer une facture
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
        
        <!-- Détails des articles -->
        <mat-card class="order-items-card">
          <mat-card-header>
            <mat-card-title>Articles commandés</mat-card-title>
          </mat-card-header>
          <mat-divider></mat-divider>
          <mat-card-content>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of order.items">
                  <td>{{ item.name }}</td>
                  <td class="center">{{ item.quantity }}</td>
                  <td class="right">{{ item.price | currency:'EUR' }}</td>
                  <td class="right">{{ item.quantity * item.price | currency:'EUR' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="right"><strong>Total</strong></td>
                  <td class="right"><strong>{{ order.totalPrice | currency:'EUR' }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </mat-card-content>
        </mat-card>
        
        <!-- Notes -->
        <mat-card class="notes-card" *ngIf="order.notes">
          <mat-card-header>
            <mat-card-title>Notes</mat-card-title>
          </mat-card-header>
          <mat-divider></mat-divider>
          <mat-card-content>
            <p>{{ order.notes }}</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .order-detail-container {
      padding: 20px;
    }
    
    .back-button {
      margin-bottom: 20px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      margin: 40px 0;
    }
    
    h1 {
      margin-bottom: 20px;
      font-weight: 500;
    }
    
    .order-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    mat-card {
      height: 100%;
      margin-bottom: 20px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .label {
      font-weight: 500;
      color: #555;
    }
    
    .address {
      margin-top: 20px;
      white-space: pre-line;
    }
    
    .map-placeholder {
      margin-top: 20px;
      height: 150px;
      background-color: #f5f5f5;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #666;
    }
    
    .coordinates {
      text-align: center;
    }
    
    .status-select {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .action-buttons {
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .items-table th, .items-table td {
      padding: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .items-table th {
      text-align: left;
      background-color: #f5f5f5;
    }
    
    .center {
      text-align: center;
    }
    
    .right {
      text-align: right;
    }
    
    .mat-chip.pending {
      background-color: #ffd740;
    }
    
    .mat-chip.processing {
      background-color: #2196f3;
      color: white;
    }
    
    .mat-chip.completed, .mat-chip.delivered, .mat-chip.paid {
      background-color: #4caf50;
      color: white;
    }
    
    .mat-chip.cancelled, .mat-chip.failed {
      background-color: #f44336;
      color: white;
    }
    
    .assign-button {
      margin-left: 10px;
    }

    mat-card-content {
      padding: 16px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ]
})
export class OrderDetailComponent implements OnInit {
  orderId: string = '';
  order: Order | null = null;
  isLoading: boolean = false;
  isUpdatingStatus: boolean = false;
  selectedStatus: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.orderId = this.route.snapshot.params['id'];
    this.loadOrderDetails();
  }

  loadOrderDetails(): void {
    this.isLoading = true;
    
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (data) => {
        this.order = data;
        this.selectedStatus = data.status;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading order details', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des détails de la commande', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  updateOrderStatus(): void {
    if (!this.order || this.selectedStatus === this.order.status) {
      return;
    }
    
    this.isUpdatingStatus = true;
    
    this.orderService.updateOrderStatus(this.orderId, this.selectedStatus).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.isUpdatingStatus = false;
        this.snackBar.open('Statut de la commande mis à jour avec succès', 'Fermer', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error updating order status', error);
        this.isUpdatingStatus = false;
        this.snackBar.open('Erreur lors de la mise à jour du statut de la commande', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/orders']);
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'processing': 'En traitement',
      'completed': 'Terminée',
      'cancelled': 'Annulée',
      'delivered': 'Livrée'
    };
    
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    return status;
  }

  getPaymentStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'paid': 'Payé',
      'failed': 'Échec'
    };
    
    return statusMap[status] || status;
  }

  getPaymentStatusClass(status: string): string {
    return status;
  }

  canBeAssigned(order: Order): boolean {
    return ['processing', 'completed'].includes(order.status);
  }
  
  openAssignDeliveryPersonDialog(): void {
    if (!this.order) return;
    
    const dialogRef = this.dialog.open(DeliveryPersonAssignDialogComponent, {
      width: '400px',
      data: { orderId: this.order.id }
    });
    
    dialogRef.afterClosed().subscribe(deliveryPersonId => {
      if (deliveryPersonId) {
        this.assignDeliveryPerson(deliveryPersonId);
      }
    });
  }
  
  assignDeliveryPerson(deliveryPersonId: number): void {
    if (!this.order) return;
    
    this.orderService.assignDeliveryPerson(this.order.id, deliveryPersonId).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.snackBar.open('Livreur assigné avec succès', 'Fermer', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error assigning delivery person', error);
        this.snackBar.open('Erreur lors de l\'assignation du livreur', 'Fermer', {
          duration: 3000
        });
      }
    });
  }
  
  cancelOrder(): void {
    if (!this.order || this.order.status === 'cancelled') return;
    
    // Confirm before cancelling
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.')) {
      this.isUpdatingStatus = true;
      
      this.orderService.updateOrderStatus(this.order.id, 'cancelled').subscribe({
        next: (updatedOrder) => {
          this.order = updatedOrder;
          this.selectedStatus = 'cancelled';
          this.isUpdatingStatus = false;
          this.snackBar.open('Commande annulée avec succès', 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error cancelling order', error);
          this.isUpdatingStatus = false;
          this.snackBar.open('Erreur lors de l\'annulation de la commande', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }
  
  openInvoiceDialog(): void {
    if (!this.order) return;
    
    this.dialog.open(InvoiceDialogComponent, {
      width: '700px',
      data: this.order
    });
  }
}