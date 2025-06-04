import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MedicineService, Medicine } from '../../../core/services/api/medicine.service';

@Component({
  selector: 'app-medicine-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="medicine-detail-container">
      <div class="back-button">
        <button mat-button (click)="navigateBack()">
          <mat-icon>arrow_back</mat-icon> Retour aux médicaments
        </button>
      </div>
      
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <div class="medicine-not-found" *ngIf="!isLoading && !medicine">
        <mat-card>
          <mat-card-content>
            <p>Le médicament #{{ medicineId }} n'a pas été trouvé.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" (click)="navigateBack()">Retour à la liste</button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <div class="medicine-details" *ngIf="!isLoading && medicine">
        <mat-card>
          <mat-card-header>
            <mat-card-title>{{ medicine.name }}</mat-card-title>
            <mat-card-subtitle>{{ medicine.generic_name }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="info-section">
              <div class="info-row">
                <div class="info-label">ID:</div>
                <div class="info-value">{{ medicine.id }}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Catégorie:</div>
                <div class="info-value">{{ medicine.category }}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Fabricant:</div>
                <div class="info-value">{{ medicine.manufacturer }}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Prix:</div>
                <div class="info-value">{{ medicine.price | currency:'EUR' }}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Stock:</div>
                <div class="info-value" [ngClass]="{'stock-low': medicine.stock < 10, 'stock-empty': medicine.stock === 0}">
                  {{ medicine.stock }} unités
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Prescription requise:</div>
                <div class="info-value">
                  <mat-icon *ngIf="medicine.requires_prescription" color="warn">check_circle</mat-icon>
                  <mat-icon *ngIf="!medicine.requires_prescription" color="primary">remove_circle_outline</mat-icon>
                </div>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="description-section">
              <h3>Description</h3>
              <p>{{ medicine.description || 'Aucune description disponible.' }}</p>
            </div>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-button color="primary" (click)="editMedicine()">
              <mat-icon>edit</mat-icon> Modifier
            </button>
            <button mat-button color="warn" (click)="deleteMedicine()">
              <mat-icon>delete</mat-icon> Supprimer
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .medicine-detail-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .back-button {
      margin-bottom: 20px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      margin: 40px 0;
    }
    
    .info-section {
      margin-bottom: 20px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 10px;
    }
    
    .info-label {
      font-weight: bold;
      min-width: 150px;
    }
    
    .stock-low {
      color: orange;
      font-weight: bold;
    }
    
    .stock-empty {
      color: red;
      font-weight: bold;
    }
    
    .description-section {
      margin-top: 20px;
    }
    
    mat-card-header {
      margin-bottom: 20px;
    }
    
    mat-card-title {
      font-size: 24px;
    }
    
    mat-divider {
      margin: 15px 0;
    }
  `]
})
export class MedicineDetailComponent implements OnInit {
  medicineId: number = 0;
  medicine: Medicine | null = null;
  isLoading: boolean = true;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private medicineService: MedicineService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.medicineId = +params['id'];
      this.loadMedicine();
    });
  }
  
  loadMedicine(): void {
    this.isLoading = true;
    this.medicineService.getMedicineById(this.medicineId).subscribe({
      next: (medicine) => {
        this.medicine = medicine;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching medicine details', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des détails du médicament', 'Fermer', {
          duration: 5000
        });
      }
    });
  }
  
  navigateBack(): void {
    this.router.navigate(['/medicines']);
  }
  
  editMedicine(): void {
    // Cette méthode sera implémentée pour naviguer vers la page d'édition ou ouvrir une boîte de dialogue
    this.snackBar.open('Fonctionnalité d\'édition en développement', 'OK', {
      duration: 3000
    });
  }
  
  deleteMedicine(): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.medicine?.name} ?`)) {
      this.isLoading = true;
      this.medicineService.deleteMedicine(this.medicineId).subscribe({
        next: () => {
          this.snackBar.open('Médicament supprimé avec succès', 'Fermer', {
            duration: 3000
          });
          this.navigateBack();
        },
        error: (error) => {
          console.error('Error deleting medicine', error);
          this.isLoading = false;
          this.snackBar.open('Erreur lors de la suppression du médicament', 'Fermer', {
            duration: 5000
          });
        }
      });
    }
  }
}
