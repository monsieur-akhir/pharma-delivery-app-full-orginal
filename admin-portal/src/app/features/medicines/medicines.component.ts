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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Medicine, MedicineFilter } from '../../shared/models/medicine.model';
import { MedicineService } from '../../core/services/api/medicine.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { MedicineDialogComponent } from './medicine-dialog/medicine-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-medicines',
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
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
    MedicineDialogComponent
  ],
  template: `
    <div class="medicines-container">
      <h1>Gestion des Médicaments</h1>
      
      <mat-card>
        <mat-card-content>
          <div class="actions-container">
            <button mat-raised-button color="primary" (click)="openMedicineDialog()">
              <mat-icon>add</mat-icon> Nouveau Médicament
            </button>
            
            <div class="filters-container">
              <mat-form-field appearance="outline">
                <mat-label>Filtrer par catégorie</mat-label>
                <mat-select [(ngModel)]="categoryFilter" (selectionChange)="onFilterChange()">
                  <mat-option [value]="">Toutes</mat-option>
                  <mat-option *ngFor="let category of categories" [value]="category">
                    {{category}}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Stock</mat-label>
                <mat-select [(ngModel)]="stockFilter" (selectionChange)="onFilterChange()">
                  <mat-option [value]="">Tous</mat-option>
                  <mat-option [value]="true">En stock</mat-option>
                  <mat-option [value]="false">Épuisé</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Rechercher</mat-label>
                <input matInput [(ngModel)]="searchQuery" placeholder="Nom du médicament" (keyup.enter)="onFilterChange()">
                <button mat-icon-button matSuffix (click)="onFilterChange()">
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
                <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
                <td mat-cell *matCellDef="let medicine">{{medicine.id}}</td>
              </ng-container>
              
              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Nom</th>
                <td mat-cell *matCellDef="let medicine">{{medicine.name}}</td>
              </ng-container>
              
              <!-- Generic Name Column -->
              <ng-container matColumnDef="generic_name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Nom Générique</th>
                <td mat-cell *matCellDef="let medicine">{{medicine.generic_name}}</td>
              </ng-container>
              
              <!-- Category Column -->
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Catégorie</th>
                <td mat-cell *matCellDef="let medicine">{{medicine.category}}</td>
              </ng-container>
              
              <!-- Price Column -->
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Prix</th>
                <td mat-cell *matCellDef="let medicine">{{medicine.price | currency:'EUR'}}</td>
              </ng-container>
              
              <!-- Stock Column -->
              <ng-container matColumnDef="stock">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Stock</th>
                <td mat-cell *matCellDef="let medicine" [ngClass]="{'low-stock': medicine.stock < 10, 'out-of-stock': medicine.stock === 0}">
                  {{medicine.stock}}
                </td>
              </ng-container>
              
              <!-- Prescription Column -->
              <ng-container matColumnDef="requires_prescription">
                <th mat-header-cell *matHeaderCellDef>Prescription</th>
                <td mat-cell *matCellDef="let medicine">
                  <mat-icon *ngIf="medicine.requires_prescription" color="warn">check_circle</mat-icon>
                  <mat-icon *ngIf="!medicine.requires_prescription" color="primary">remove_circle_outline</mat-icon>
                </td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let medicine">
                  <button mat-icon-button color="primary" (click)="editMedicine(medicine)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteMedicine(medicine)">
                    <mat-icon>delete</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" [matMenuTriggerFor]="stockMenu" [attr.aria-label]="'Gérer le stock de ' + medicine.name">
                    <mat-icon>inventory_2</mat-icon>
                  </button>
                  <mat-menu #stockMenu="matMenu">
                    <button mat-menu-item (click)="updateStock(medicine, 'add', 1)">
                      <mat-icon color="primary">add_circle</mat-icon>
                      <span>Ajouter 1</span>
                    </button>
                    <button mat-menu-item (click)="updateStock(medicine, 'add', 5)">
                      <mat-icon color="primary">add_circle</mat-icon>
                      <span>Ajouter 5</span>
                    </button>
                    <button mat-menu-item (click)="updateStock(medicine, 'add', 10)">
                      <mat-icon color="primary">add_circle</mat-icon>
                      <span>Ajouter 10</span>
                    </button>
                    <button mat-menu-item (click)="updateStock(medicine, 'remove', 1)" [disabled]="medicine.stock < 1">
                      <mat-icon color="warn">remove_circle</mat-icon>
                      <span>Retirer 1</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            
            <mat-paginator [length]="totalMedicines" 
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
    .medicines-container {
      padding: 20px;
    }
    
    .actions-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 20px;
      gap: 16px;
    }
    
    .filters-container {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
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
    
    .mat-column-actions {
      width: 150px;
      text-align: center;
    }
    
    .mat-column-requires_prescription {
      width: 120px;
      text-align: center;
    }
    
    .low-stock {
      color: orange;
      font-weight: bold;
    }
    
    .out-of-stock {
      color: red;
      font-weight: bold;
    }
    
    @media (max-width: 768px) {
      .actions-container {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .filters-container {
        width: 100%;
      }
      
      mat-form-field {
        width: 100%;
      }
    }
  `]
})
export class MedicinesComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'generic_name', 'category', 'price', 'stock', 'requires_prescription', 'actions'];
  dataSource = new MatTableDataSource<Medicine>([]);
  isLoading = false;
  totalMedicines = 0;
  pageSize = 10;
  pageIndex = 0;
  categoryFilter = '';
  stockFilter = '';
  searchQuery = '';
  categories: string[] = [];
  private subscription = new Subscription();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private medicineService: MedicineService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadMedicines();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  loadCategories(): void {
    const sub = this.medicineService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
    
    this.subscription.add(sub);
  }
  
  loadMedicines(): void {
    this.isLoading = true;
    
    const filter: MedicineFilter = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };
    
    if (this.categoryFilter) {
      filter.category = this.categoryFilter;
    }
    
    if (this.stockFilter === 'true') {
      filter.inStock = true;
    } else if (this.stockFilter === 'false') {
      filter.inStock = false;
    }
    
    if (this.searchQuery) {
      filter.name = this.searchQuery;
    }
    
    const sub = this.medicineService.getMedicines(filter).subscribe({
      next: (response) => {
        this.dataSource.data = response.medicines;
        this.totalMedicines = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
    
    this.subscription.add(sub);
  }
  
  onFilterChange(): void {
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadMedicines();
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadMedicines();
  }
  
  openMedicineDialog(medicine?: Medicine): void {
    const dialogRef = this.dialog.open(MedicineDialogComponent, {
      width: '600px',
      data: { medicine }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMedicines();
      }
    });
  }
  
  editMedicine(medicine: Medicine): void {
    this.openMedicineDialog(medicine);
  }
  
  deleteMedicine(medicine: Medicine): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${medicine.name} ?`)) {
      this.isLoading = true;
      
      const sub = this.medicineService.deleteMedicine(medicine.id).subscribe({
        next: () => {
          this.snackBar.open(`${medicine.name} a été supprimé avec succès`, 'Fermer', {
            duration: 3000
          });
          this.loadMedicines();
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.isLoading = false;
        }
      });
      
      this.subscription.add(sub);
    }
  }
  
  updateStock(medicine: Medicine, type: 'add' | 'remove' | 'set', quantity: number): void {
    this.isLoading = true;
    
    const sub = this.medicineService.updateStock(medicine.id, quantity, type).subscribe({
      next: (updatedMedicine) => {
        const message = type === 'add' 
          ? `${quantity} unité(s) ajoutée(s) au stock de ${medicine.name}`
          : `${quantity} unité(s) retirée(s) du stock de ${medicine.name}`;
          
        this.snackBar.open(message, 'Fermer', {
          duration: 3000
        });
        
        // Update the item in the dataSource without reloading
        const index = this.dataSource.data.findIndex(m => m.id === updatedMedicine.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedMedicine;
          this.dataSource._updateChangeSubscription();
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
    
    this.subscription.add(sub);
  }
}