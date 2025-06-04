import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Order } from '../../../shared/models/order.model';

@Component({
  selector: 'app-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Facture #{{ order.id }}</h2>
    
    <div mat-dialog-content>
      <div class="invoice-container">
        <div class="invoice-header">
          <h3>Pharma Delivery</h3>
          <p>Facture générée le: {{ today | date:'dd/MM/yyyy HH:mm' }}</p>
        </div>
        
        <div class="invoice-details">
          <div class="detail-row">
            <span class="label">Commande #:</span>
            <span class="value">{{ order.id }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date de commande:</span>
            <span class="value">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Client ID:</span>
            <span class="value">{{ order.userId }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Adresse de livraison:</span>
            <span class="value">{{ order.deliveryAddress }}</span>
          </div>
        </div>
        
        <table class="invoice-items">
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
        
        <div class="invoice-footer">
          <p>Méthode de paiement: {{ order.paymentMethod }}</p>
          <p>Statut du paiement: {{ getPaymentStatusLabel(order.paymentStatus) }}</p>
          <p>Merci de votre confiance !</p>
        </div>
      </div>
    </div>
    
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Fermer</button>
      <button mat-raised-button color="primary" (click)="onPrint()">
        Imprimer
      </button>
    </div>
  `,
  styles: [`
    .invoice-container {
      padding: 20px;
      border: 1px solid #ddd;
      background-color: white;
      min-width: 500px;
    }
    
    .invoice-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }
    
    .invoice-header h3 {
      margin: 0;
      font-weight: 500;
      color: #333;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .label {
      font-weight: 500;
    }
    
    .invoice-details {
      margin-bottom: 20px;
    }
    
    .invoice-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .invoice-items th, .invoice-items td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    
    .invoice-items th {
      background-color: #f5f5f5;
    }
    
    .center {
      text-align: center;
    }
    
    .right {
      text-align: right;
    }
    
    .invoice-footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center;
    }
  `]
})
export class InvoiceDialogComponent implements OnInit {
  today: Date = new Date();
  
  constructor(
    private dialogRef: MatDialogRef<InvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public order: Order
  ) {}

  ngOnInit(): void {}

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }

  getPaymentStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'paid': 'Payé',
      'failed': 'Échec'
    };
    
    return statusMap[status] || status;
  }
}
