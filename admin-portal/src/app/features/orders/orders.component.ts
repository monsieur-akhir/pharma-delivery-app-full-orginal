import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
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
import { Order } from '../../shared/models/order.model';
import { OrderService } from '../../core/services/api/order.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

@Component({
  selector: 'app-orders',
  template: `
    <div class="orders-container">
      <h1>Gestion des Commandes</h1>
      
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
                <mat-option value="delivered">Livrée</mat-option>
                <mat-option value="cancelled">Annulée</mat-option>
              </mat-select>
            </mat-form-field>
            
            <div class="search-container">
              <mat-form-field appearance="outline">
                <mat-label>Rechercher</mat-label>
                <input matInput [(ngModel)]="searchQuery" placeholder="ID de commande, client" (keyup.enter)="loadOrders()">
                <button mat-icon-button matSuffix (click)="loadOrders()">
                  <mat-icon>search</mat-icon>
                </button>
              </mat-form-field>
            </div>
          </div>
          
          <div class="loading-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <div class="table-container" *ngIf="!isLoading">
            <table mat-table [dataSource]="dataSource" matSort>
              
              <!-- ID Column -->
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let order">{{order.id}}</td>
              </ng-container>
              
              <!-- Customer Column -->
              <ng-container matColumnDef="customer">
                <th mat-header-cell *matHeaderCellDef>Client</th>
                <td mat-cell *matCellDef="let order">Client #{{order.userId}}</td>
              </ng-container>
              
              <!-- Pharmacy Column -->
              <ng-container matColumnDef="pharmacy">
                <th mat-header-cell *matHeaderCellDef>Pharmacie</th>
                <td mat-cell *matCellDef="let order">Pharmacie #{{order.pharmacyId}}</td>
              </ng-container>
              
              <!-- Total Column -->
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Montant</th>
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
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let order">{{order.createdAt | date:'dd/MM/yyyy H:mm'}}</td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let order">
                  <button mat-icon-button color="primary" [routerLink]="['/orders', order.id]">
                    <mat-icon>visibility</mat-icon>
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
    .orders-container {
      padding: 20px;
    }
    
    .actions-container {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    
    .search-container {
      flex-grow: 1;
      max-width: 400px;
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
    
    .mat-chip.completed, .mat-chip.delivered {
      background-color: #4caf50;
      color: white;
    }
    
    .mat-chip.cancelled {
      background-color: #f44336;
      color: white;
    }
  `],
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
  ]
})
export class OrdersComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'customer', 'pharmacy', 'total', 'status', 'date', 'actions'];
  dataSource = new MatTableDataSource<Order>([]);
  isLoading = false;
  totalOrders = 0;
  pageSize = 10;
  pageIndex = 0;
  statusFilter = '';
  searchQuery = '';
  private subscription = new Subscription();
  
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  constructor(
    private orderService: OrderService,
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
    
    const sub = this.orderService.getOrders(this.pageIndex + 1, this.pageSize, this.statusFilter)
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.orders;
          this.totalOrders = response.total;
          this.isLoading = false;
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
  
  getStatusLabel(status: Order['status']): string {
    const labels: Record<Order['status'], string> = {
      pending:   'En attente',
      processing:'En traitement',
      completed: 'Terminée',
      cancelled: 'Annulée',
      delivered: 'Livrée'
    };
    return labels[status] ?? status;
  }
  
  getStatusClass(status: string): string {
    return status;
  }
}