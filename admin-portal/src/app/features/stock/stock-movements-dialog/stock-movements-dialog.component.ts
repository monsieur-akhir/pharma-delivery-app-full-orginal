import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MedicineStock, StockChangeReason, StockMovement } from '../../../core/models/stock.model';
import { StockService } from '../../../core/services/api/stock.service';

export interface StockMovementsDialogData {
  stock: MedicineStock;
}

@Component({
  selector: 'app-stock-movements-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Historique des mouvements de stock</h2>
    
    <mat-dialog-content>
      <div class="stock-info">
        <p><strong>Médicament:</strong> {{ data.stock.medicine?.name }}</p>
        <p><strong>Pharmacie:</strong> {{ data.stock.pharmacy?.name }}</p>
        <p><strong>Quantité actuelle:</strong> {{ data.stock.quantity }}</p>
      </div>

      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Chargement de l'historique...</p>
      </div>

      <div class="no-data-message" *ngIf="!isLoading && dataSource.data.length === 0">
        <p>Aucun mouvement de stock enregistré pour ce médicament.</p>
      </div>

      <div class="table-container" *ngIf="!isLoading && dataSource.data.length > 0">
        <table mat-table [dataSource]="dataSource" matSort>
          <!-- Date Column -->
          <ng-container matColumnDef="timestamp">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
            <td mat-cell *matCellDef="let item">{{ item.timestamp | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>

          <!-- Type Column -->
          <ng-container matColumnDef="changeReason">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
            <td mat-cell *matCellDef="let item">{{ getReasonLabel(item.changeReason) }}</td>
          </ng-container>

          <!-- Quantity Before Column -->
          <ng-container matColumnDef="previousQuantity">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Quantité avant</th>
            <td mat-cell *matCellDef="let item">{{ item.previousQuantity }}</td>
          </ng-container>

          <!-- Quantity After Column -->
          <ng-container matColumnDef="newQuantity">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Quantité après</th>
            <td mat-cell *matCellDef="let item">{{ item.newQuantity }}</td>
          </ng-container>

          <!-- Change Column -->
          <ng-container matColumnDef="change">
            <th mat-header-cell *matHeaderCellDef>Variation</th>
            <td mat-cell *matCellDef="let item" [ngClass]="getChangeClass(item)">
              {{ getChangeText(item) }}
            </td>
          </ng-container>

          <!-- User Column -->
          <ng-container matColumnDef="createdBy">
            <th mat-header-cell *matHeaderCellDef>Utilisateur</th>
            <td mat-cell *matCellDef="let item">{{ item.createdBy }}</td>
          </ng-container>

          <!-- Notes Column -->
          <ng-container matColumnDef="notes">
            <th mat-header-cell *matHeaderCellDef>Notes</th>
            <td mat-cell *matCellDef="let item">{{ item.notes || '-' }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator 
          [pageSizeOptions]="[5, 10, 25, 100]"
          [pageSize]="pageSize"
          [pageIndex]="currentPage"
          [length]="totalMovements"
          showFirstLastButtons
          aria-label="Sélectionner une page">
        </mat-paginator>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="true">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .stock-info {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    .stock-info p {
      margin: 5px 0;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .table-container {
      max-height: 400px;
      overflow: auto;
    }
    
    table {
      width: 100%;
    }
    
    .mat-column-notes {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .positive-change {
      color: green;
      font-weight: bold;
    }
    
    .negative-change {
      color: red;
      font-weight: bold;
    }
  `]
})
export class StockMovementsDialogComponent implements OnInit {
  dataSource = new MatTableDataSource<StockMovement>([]);
  displayedColumns: string[] = ['timestamp', 'changeReason', 'previousQuantity', 'newQuantity', 'change', 'createdBy', 'notes'];
  isLoading = true;
  totalMovements = 0;
  currentPage = 0;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialogRef: MatDialogRef<StockMovementsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockMovementsDialogData,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.loadMovements();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Handle pagination events
    if (this.paginator) {
      this.paginator.page.subscribe((event: PageEvent) => {
        this.currentPage = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadMovements();
      });
    }
  }

  loadMovements(): void {
    this.isLoading = true;
    this.stockService.getStockMovements(this.data.stock.id, this.currentPage + 1, this.pageSize).subscribe({
      next: (response) => {
        this.dataSource.data = response.movements;
        this.totalMovements = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des mouvements de stock', error);
        this.isLoading = false;
      }
    });
  }

  getReasonLabel(reason: StockChangeReason): string {
    switch (reason) {
      case StockChangeReason.PURCHASE:
        return 'Achat';
      case StockChangeReason.SALE:
        return 'Vente';
      case StockChangeReason.RETURN:
        return 'Retour';
      case StockChangeReason.ADJUSTMENT:
        return 'Ajustement';
      case StockChangeReason.EXPIRY:
        return 'Expiration';
      case StockChangeReason.DAMAGE:
        return 'Dommage';
      case StockChangeReason.TRANSFER_IN:
        return 'Transfert entrant';
      case StockChangeReason.TRANSFER_OUT:
        return 'Transfert sortant';
      default:
        return reason;
    }
  }

  getChangeClass(movement: StockMovement): string {
    const change = movement.newQuantity - movement.previousQuantity;
    if (change > 0) {
      return 'positive-change';
    } else if (change < 0) {
      return 'negative-change';
    }
    return '';
  }

  getChangeText(movement: StockMovement): string {
    const change = movement.newQuantity - movement.previousQuantity;
    if (change > 0) {
      return `+${change}`;
    }
    return `${change}`;
  }
}
