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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { Subscription } from 'rxjs';

import { Prescription } from '../../../shared/models/prescription.model';
import { PrescriptionService } from '../../../core/services/api/prescription.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-pending-prescriptions',
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
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    RouterModule,
    FormsModule // Add FormsModule here
  ],
  template: `
    <div class="prescriptions-container">
      <h1>Ordonnances en attente de validation</h1>
      
      <mat-card>
        <mat-card-content>
          <div class="search-container">
            <mat-form-field appearance="outline">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" placeholder="ID, utilisateur" (keyup.enter)="loadPrescriptions()">
              <button mat-icon-button matSuffix (click)="loadPrescriptions()">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>
          </div>
          
          <div class="loading-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <div class="table-container" *ngIf="!isLoading">
            <table mat-table [dataSource]="dataSource" matSort>
              
              <!-- ID Column -->
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
                <td mat-cell *matCellDef="let prescription">{{prescription.id | slice:0:8}}...</td>
              </ng-container>
              
              <!-- User Column -->
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Utilisateur</th>
                <td mat-cell *matCellDef="let prescription">Utilisateur #{{prescription.userId}}</td>
              </ng-container>
              
              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Date de soumission</th>
                <td mat-cell *matCellDef="let prescription">{{prescription.createdAt | date:'dd/MM/yyyy HH:mm'}}</td>
              </ng-container>
              
              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let prescription">
                  <mat-chip [ngClass]="getStatusClass(prescription.status)">
                    {{getStatusLabel(prescription.status)}}
                  </mat-chip>
                </td>
              </ng-container>
              
              <!-- Image Column -->
              <ng-container matColumnDef="image">
                <th mat-header-cell *matHeaderCellDef>Image</th>
                <td mat-cell *matCellDef="let prescription">
                  <button mat-icon-button color="primary" (click)="viewImage(prescription)">
                    <mat-icon>image</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <!-- OCR Column -->
              <ng-container matColumnDef="ocr">
                <th mat-header-cell *matHeaderCellDef>Texte OCR</th>
                <td mat-cell *matCellDef="let prescription">
                  <button mat-icon-button color="primary" (click)="runOcr(prescription)" [disabled]="prescription.ocrText">
                    <mat-icon>document_scanner</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" (click)="viewOcr(prescription)" *ngIf="prescription.ocrText">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let prescription">
                  <button mat-icon-button color="primary" [routerLink]="['/prescriptions', prescription.id]">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" (click)="verifyPrescription(prescription)" *ngIf="prescription.status === 'pending'">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="rejectPrescription(prescription)" *ngIf="prescription.status === 'pending'">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            
            <mat-paginator [length]="totalPrescriptions" 
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
    .prescriptions-container {
      padding: 20px;
    }
    
    .search-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    
    .search-container mat-form-field {
      width: 300px;
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
    
    .mat-chip.verified {
      background-color: #4caf50;
      color: white;
    }
    
    .mat-chip.rejected {
      background-color: #f44336;
      color: white;
    }
  `]
})
export class PendingPrescriptionsComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'user', 'date', 'status', 'image', 'ocr', 'actions'];
  dataSource = new MatTableDataSource<Prescription>([]);
  isLoading = false;
  totalPrescriptions = 0;
  pageSize = 10;
  pageIndex = 0;
  searchQuery = '';
  
  private subscription = new Subscription();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private prescriptionService: PrescriptionService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.loadPrescriptions();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  loadPrescriptions(): void {
    this.isLoading = true;
    
    const sub = this.prescriptionService.getAllPrescriptions(this.pageIndex + 1, this.pageSize, 'pending')
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.prescriptions;
          this.totalPrescriptions = response.total;
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
  
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPrescriptions();
  }
  
  getStatusLabel(status: Prescription['status']): string {
    const labels: Record<Prescription['status'], string> = {
      'pending': 'En attente',
      'verified': 'Vérifiée',
      'rejected': 'Rejetée'
    };
    return labels[status] || status;
  }
  
  getStatusClass(status: string): string {
    return status;
  }
  
  viewImage(prescription: Prescription): void {
    // Ouvrir la fenêtre modale pour voir l'ordonnance
    console.log('View prescription image:', prescription.imageUrl);
    window.open(prescription.imageUrl, '_blank');
  }
  
  runOcr(prescription: Prescription): void {
    this.isLoading = true;
    
    const sub = this.prescriptionService.runOcr(prescription.id)
      .subscribe({
        next: (response) => {
          // Mettre à jour l'élément dans le tableau
          const index = this.dataSource.data.findIndex(p => p.id === prescription.id);
          if (index !== -1) {
            this.dataSource.data[index].ocrText = response.text;
            // Force refresh of table data
            this.dataSource.data = [...this.dataSource.data];
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
  
  viewOcr(prescription: Prescription): void {
    // Afficher le texte OCR dans une fenêtre modale
    console.log('OCR Text:', prescription.ocrText);
    alert(prescription.ocrText);
  }
  
  verifyPrescription(prescription: Prescription): void {
    this.isLoading = true;
    
    const sub = this.prescriptionService.verifyPrescription(prescription.id, 'admin')
      .subscribe({
        next: (updatedPrescription) => {
          // Mettre à jour le tableau
          const index = this.dataSource.data.findIndex(p => p.id === prescription.id);
          if (index !== -1) {
            this.dataSource.data[index] = updatedPrescription;
            // Force refresh of table data
            this.dataSource.data = [...this.dataSource.data];
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
  
  rejectPrescription(prescription: Prescription): void {
    const reason = prompt('Veuillez indiquer la raison du rejet:');
    if (reason !== null) {
      this.isLoading = true;
      
      const sub = this.prescriptionService.rejectPrescription(prescription.id, reason)
        .subscribe({
          next: (updatedPrescription) => {
            // Mettre à jour le tableau
            const index = this.dataSource.data.findIndex(p => p.id === prescription.id);
            if (index !== -1) {
              this.dataSource.data[index] = updatedPrescription;
              // Force refresh of table data
              this.dataSource.data = [...this.dataSource.data];
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
}
