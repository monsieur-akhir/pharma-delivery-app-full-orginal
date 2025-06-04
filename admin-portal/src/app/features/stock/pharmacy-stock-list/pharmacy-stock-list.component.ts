import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { StockService } from '../../../core/services/api/stock.service';
import { PharmacyService } from '../../../core/services/api/pharmacy.service';
import { MedicineStock } from '../../../core/models/stock.model';
import { MedicineCategory } from '../../../core/models/medicine.model';
import { StockAdjustDialogComponent } from '../stock-adjust-dialog/stock-adjust-dialog.component';
import { StockTransferDialogComponent } from '../stock-transfer-dialog/stock-transfer-dialog.component';
import { StockMovementsDialogComponent } from '../stock-movements-dialog/stock-movements-dialog.component';

@Component({
  selector: 'app-pharmacy-stock-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="pharmacy-stock-container">
      <div class="page-header">
        <h1>Gestion des stocks - {{ pharmacyName }}</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="addMedicine()">
            <mat-icon>add</mat-icon> Ajouter un médicament
          </button>
          <button mat-raised-button color="accent" (click)="generateReport()">
            <mat-icon>summarize</mat-icon> Générer un rapport
          </button>
        </div>
      </div>

      <!-- Filtres -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" placeholder="Nom du médicament">
              <button mat-icon-button matSuffix (click)="applyFilters()" aria-label="Rechercher">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Catégorie</mat-label>
              <mat-select [(ngModel)]="categoryFilter">
                <mat-option [value]="''">Toutes</mat-option>
                <mat-option *ngFor="let category of categories" [value]="category">
                  {{ getCategoryName(category) }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Stock</mat-label>
              <mat-select [(ngModel)]="stockFilter">
                <mat-option [value]="''">Tous</mat-option>
                <mat-option [value]="'low'">Stock bas</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="filter-actions">
              <button mat-flat-button color="primary" (click)="applyFilters()">Appliquer</button>
              <button mat-stroked-button (click)="clearFilters()">Effacer</button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tableau des stocks -->
      <div class="stock-table-container">
        <div class="loading-container" *ngIf="isLoading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Chargement des stocks...</p>
        </div>

        <div class="no-data-message" *ngIf="!isLoading && dataSource.data.length === 0">
          <p>Aucun médicament trouvé dans le stock de cette pharmacie.</p>
          <button mat-raised-button color="primary" (click)="addMedicine()">Ajouter un médicament</button>
        </div>

        <table mat-table [dataSource]="dataSource" matSort *ngIf="!isLoading && dataSource.data.length > 0">
          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
            <td mat-cell *matCellDef="let item">{{ item.medicine?.id }}</td>
          </ng-container>

          <!-- Nom Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Médicament</th>
            <td mat-cell *matCellDef="let item">
              <div class="med-name">{{ item.medicine?.name }}</div>
              <div class="med-generic">{{ item.medicine?.genericName }}</div>
            </td>
          </ng-container>

          <!-- Catégorie Column -->
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Catégorie</th>
            <td mat-cell *matCellDef="let item">
              {{ getCategoryName(item.medicine?.category) }}
            </td>
          </ng-container>

          <!-- Quantité Column -->
          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Quantité</th>
            <td mat-cell *matCellDef="let item" [ngClass]="getStockLevelClass(item)">
              {{ item.quantity }}
            </td>
          </ng-container>

          <!-- Niveau de réapprovisionnement Column -->
          <ng-container matColumnDef="reorderLevel">
            <th mat-header-cell *matHeaderCellDef>Seuil d'alerte</th>
            <td mat-cell *matCellDef="let item">{{ item.reorderLevel }}</td>
          </ng-container>

          <!-- Prix Column -->
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Prix</th>
            <td mat-cell *matCellDef="let item">{{ item.medicine?.price | currency:'EUR':'symbol':'1.2-2' }}</td>
          </ng-container>

          <!-- Dernière mise à jour Column -->
          <ng-container matColumnDef="lastUpdated">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Dernière mise à jour</th>
            <td mat-cell *matCellDef="let item">{{ item.lastUpdated | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>

          <!-- Date d'expiration Column -->
          <ng-container matColumnDef="expiryDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Date d'expiration</th>
            <td mat-cell *matCellDef="let item" [ngClass]="getExpiryClass(item)">
              {{ item.expiryDate ? (item.expiryDate | date:'dd/MM/yyyy') : 'N/A' }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="adjustStock(item)">
                  <mat-icon>exposure</mat-icon>
                  <span>Ajuster le stock</span>
                </button>
                <button mat-menu-item (click)="transferStock(item)">
                  <mat-icon>swap_horiz</mat-icon>
                  <span>Transférer vers une autre pharmacie</span>
                </button>
                <button mat-menu-item (click)="viewMovements(item)">
                  <mat-icon>history</mat-icon>
                  <span>Historique des mouvements</span>
                </button>
                <button mat-menu-item (click)="editStock(item)">
                  <mat-icon>edit</mat-icon>
                  <span>Modifier les détails</span>
                </button>
                <button mat-menu-item (click)="removeFromStock(item)" class="delete-action">
                  <mat-icon>delete</mat-icon>
                  <span>Retirer du stock</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 25, 50, 100]"
          [length]="totalItems"
          (page)="onPageChange($event)"
          *ngIf="!isLoading && dataSource.data.length > 0"
          showFirstLastButtons
          aria-label="Sélectionnez une page">
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .pharmacy-stock-container {
      padding: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .filters-card {
      margin-bottom: 20px;
    }

    .filters {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filters mat-form-field {
      flex: 1;
      min-width: 200px;
    }

    .filter-actions {
      display: flex;
      gap: 10px;
    }

    .stock-table-container {
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
    }

    .no-data-message {
      text-align: center;
      padding: 40px 20px;
    }

    .no-data-message p {
      margin-bottom: 20px;
      color: #666;
    }

    .med-name {
      font-weight: 500;
    }

    .med-generic {
      font-size: 0.9em;
      color: #666;
    }

    .stock-low {
      color: #f44336;
      font-weight: bold;
    }

    .stock-normal {
      color: #4caf50;
    }

    .expiry-expired {
      color: #f44336;
      font-weight: bold;
    }

    .expiry-soon {
      color: #ff9800;
      font-weight: bold;
    }

    .delete-action {
      color: #f44336;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }
    }
  `]
})
export class PharmacyStockListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'category', 'quantity', 'reorderLevel', 'price', 'lastUpdated', 'expiryDate', 'actions'];
  dataSource = new MatTableDataSource<MedicineStock>([]);
  
  pharmacyId!: number;
  pharmacyName = '';
  
  isLoading = false;
  searchQuery = '';
  categoryFilter = '';
  stockFilter = '';
  
  pageSize = 10;
  currentPage = 0;
  totalItems = 0;
  
  categories = Object.values(MedicineCategory);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService,
    private pharmacyService: PharmacyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['pharmacyId']) {
        this.pharmacyId = +params['pharmacyId'];
        this.loadPharmacyDetails();
        this.loadStockData();
      } else {
        this.snackBar.open('ID de pharmacie non fourni', 'Fermer', {
          duration: 3000
        });
        this.router.navigate(['/pharmacies']);
      }
    });
  }
  
  loadPharmacyDetails(): void {
    this.pharmacyService.getPharmacyById(this.pharmacyId).subscribe({
      next: (pharmacy) => {
        this.pharmacyName = pharmacy.name;
      },
      error: (error) => {
        console.error('Error loading pharmacy details', error);
        this.snackBar.open('Erreur lors du chargement des détails de la pharmacie', 'Fermer', {
          duration: 3000
        });
      }
    });
  }
  
  loadStockData(): void {
    this.isLoading = true;
    
    const lowStock = this.stockFilter === 'low' ? true : undefined;
    
    this.stockService.getPharmacyStock(
      this.pharmacyId,
      this.currentPage + 1,
      this.pageSize,
      this.searchQuery,
      this.categoryFilter,
      lowStock
    ).subscribe({
      next: (response) => {
        this.dataSource.data = response.stock;
        this.totalItems = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading stock data', error);
        this.snackBar.open('Erreur lors du chargement des données de stock', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }
  
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadStockData();
  }
  
  applyFilters(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadStockData();
  }
  
  clearFilters(): void {
    this.searchQuery = '';
    this.categoryFilter = '';
    this.stockFilter = '';
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadStockData();
  }
  
  getCategoryName(category?: string): string {
    if (!category) return 'Non définie';
    
    const categoryMap: {[key: string]: string} = {
      'PRESCRIPTION': 'Sur ordonnance',
      'OVER_THE_COUNTER': 'Sans ordonnance',
      'SUPPLEMENT': 'Supplément',
      'EQUIPMENT': 'Équipement',
      'COSMETIC': 'Cosmétique',
      'OTHER': 'Autre'
    };
    
    return categoryMap[category] || category;
  }
  
  getStockLevelClass(stock: MedicineStock): string {
    if (stock.quantity <= stock.reorderLevel) {
      return 'stock-low';
    }
    return 'stock-normal';
  }
  
  getExpiryClass(stock: MedicineStock): string {
    if (!stock.expiryDate) return '';
    
    const today = new Date();
    const expiryDate = new Date(stock.expiryDate);
    
    if (expiryDate < today) {
      return 'expiry-expired';
    }
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    if (expiryDate < thirtyDaysFromNow) {
      return 'expiry-soon';
    }
    
    return '';
  }
  
  addMedicine(): void {
    this.router.navigate(['/stock', this.pharmacyId, 'add']);
  }
  
  editStock(stock: MedicineStock): void {
    this.router.navigate(['/stock', this.pharmacyId, 'edit', stock.id]);
  }
  
  adjustStock(stock: MedicineStock): void {
    const dialogRef = this.dialog.open(StockAdjustDialogComponent, {
      width: '500px',
      data: {
        stock: stock,
        medicineName: stock.medicine?.name
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStockData();
      }
    });
  }
  
  transferStock(stock: MedicineStock): void {
    const dialogRef = this.dialog.open(StockTransferDialogComponent, {
      width: '500px',
      data: {
        stock: stock,
        sourcePharmacyId: this.pharmacyId,
        medicineName: stock.medicine?.name
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStockData();
      }
    });
  }
  
  viewMovements(stock: MedicineStock): void {
    this.dialog.open(StockMovementsDialogComponent, {
      width: '800px',
      data: {
        stockId: stock.id,
        medicineName: stock.medicine?.name
      }
    });
  }
  
  removeFromStock(stock: MedicineStock): void {
    if (confirm(`Êtes-vous sûr de vouloir retirer ${stock.medicine?.name} du stock de cette pharmacie ?`)) {
      this.isLoading = true;
      this.stockService.removeMedicineFromStock(stock.id).subscribe({
        next: () => {
          this.snackBar.open('Médicament retiré du stock avec succès', 'Fermer', {
            duration: 3000
          });
          this.loadStockData();
        },
        error: (error) => {
          console.error('Error removing medicine from stock', error);
          this.snackBar.open('Erreur lors de la suppression du médicament du stock', 'Fermer', {
            duration: 3000
          });
          this.isLoading = false;
        }
      });
    }
  }
  
  generateReport(): void {
    this.isLoading = true;
    this.stockService.generateStockReport(this.pharmacyId).subscribe({
      next: (blob) => {
        this.isLoading = false;
        
        // Créer un URL pour le blob et télécharger le fichier
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-report-pharmacy-${this.pharmacyId}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        console.error('Error generating report', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la génération du rapport', 'Fermer', {
          duration: 3000
        });
      }
    });
  }
}
