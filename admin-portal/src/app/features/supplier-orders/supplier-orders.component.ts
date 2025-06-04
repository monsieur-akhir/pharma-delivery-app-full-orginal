import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { SupplierOrder } from '../../shared/models/supplier-order.model';
import { SupplierOrderService } from '../../core/services/api/supplier-order.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

@Component({
  selector: 'app-supplier-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterModule
  ],
  template: `
    <div class="supplier-orders-container">
      <h1>Commandes Fournisseurs</h1>
      
      <mat-card>
        <mat-card-content>
          <div class="actions-container">
            <mat-form-field appearance="outline">
              <mat-label>Filtrer par statut</mat-label>
              <mat-select [(ngModel)]="statusFilter" (selectionChange)="onStatusFilterChange()">
                <mat-option [value]="">Tous</mat-option>
                <mat-option value="pending">En attente</mat-option>
                <mat-option value="processing">En traitement</mat-option>
                <mat-option value="completed">Terminée</mat-option>
                <mat-option value="cancelled">Annulée</mat-option>
              </mat-select>
            </mat-form-field>
            
            <div class="spacer"></div>
            
            <button mat-raised-button color="primary" routerLink="/supplier-orders/new">
              <mat-icon>add</mat-icon> Nouvelle commande
            </button>
          </div>
          
          <div class="loading-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <div class="table-container" *ngIf="!isLoading">
            <table mat-table [dataSource]="dataSource" matSort>
              
              <!-- ID Column -->
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
                <td mat-cell *matCellDef="let order">{{order.id | slice:0:8}}...</td>
              </ng-container>
              
              <!-- Pharmacy Column -->
              <ng-container matColumnDef="pharmacy">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Pharmacie</th>
                <td mat-cell *matCellDef="let order">Pharmacie #{{order.pharmacyId}}</td>
              </ng-container>
              
              <!-- Supplier Column -->
              <ng-container matColumnDef="supplier">
                <th mat-header-cell *matHeaderCellDef>Fournisseur</th>
                <td mat-cell *matCellDef="let order">Fournisseur #{{order.supplierId}}</td>
              </ng-container>
              
              <!-- Items Count Column -->
              <ng-container matColumnDef="itemsCount">
                <th mat-header-cell *matHeaderCellDef>Articles</th>
                <td mat-cell *matCellDef="let order">{{order.items.length}}</td>
              </ng-container>
              
              <!-- Total Column -->
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Montant</th>
                <td mat-cell *matCellDef="let order">{{order.totalPrice | currency:'EUR'}}</td>
              </ng-container>
              
              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let order">
                  <mat-chip [ngClass]="getStatusClass(order.status)">
                    {{getStatusLabel(order.status)}}
                  </mat-chip>
                </td>
              </ng-container>
              
              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
                <td mat-cell *matCellDef="let order">{{order.createdAt | date:'dd/MM/yyyy'}}</td>
              </ng-container>
              
              <!-- Expected Delivery Column -->
              <ng-container matColumnDef="expectedDelivery">
                <th mat-header-cell *matHeaderCellDef>Livraison prévue</th>
                <td mat-cell *matCellDef="let order">
                  {{order.expectedDeliveryDate ? (order.expectedDeliveryDate | date:'dd/MM/yyyy') : 'Non définie'}}
                </td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let order">
                  <button mat-icon-button color="primary" [routerLink]="['/supplier-orders', order.id]">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" (click)="updateStatus(order)">
                    <mat-icon>edit</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            
            <mat-paginator [length]="totalOrders" 
                           [pageSize]="pageSize"
                           [pageSizeOptions]="[5, 10, 25, 50]"
                           (page)="onPageChange($event)">
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .supplier-orders-container {
      padding: 20px;
    }
    
    .actions-container {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px;
    }
    
    .spacer {
      flex-grow: 1;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      margin: 40px 0;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    table {
      width: 100%;
    }
    
    .mat-chip.pending {
      background-color: #ffd740;
    }
    
    .mat-chip.processing {
      background-color: #2196f3;
      color: white;
    }
    
    .mat-chip.completed {
      background-color: #4caf50;
      color: white;
    }
    
    .mat-chip.cancelled {
      background-color: #f44336;
      color: white;
    }
  `]
})
export class SupplierOrdersComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'pharmacy', 'supplier', 'itemsCount', 'total', 'status', 'date', 'expectedDelivery', 'actions'];
  dataSource = new MatTableDataSource<SupplierOrder>([]);
  isLoading = false;
  totalOrders = 0;
  pageSize = 10;
  pageIndex = 0;
  statusFilter = '';
  private subscription = new Subscription();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private supplierOrderService: SupplierOrderService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  loadOrders(): void {
    this.isLoading = true;
    
    const sub = this.supplierOrderService.getAllSupplierOrders(this.pageIndex + 1, this.pageSize, this.statusFilter)
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.orders;
          this.totalOrders = response.total;
          this.isLoading = false;
          
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.isLoading = false;
        }
      });
      
    this.subscription.add(sub);
  }
  
  onStatusFilterChange(): void {
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadOrders();
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }
  
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'processing': 'En traitement',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }
  
  getStatusClass(status: string): string {
    return status;
  }
  
  updateStatus(order: SupplierOrder): void {
    // Ici, vous pourriez ouvrir un dialogue pour changer le statut
    console.log('Update status for order:', order.id);
  }
}
