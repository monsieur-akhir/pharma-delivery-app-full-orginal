import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PharmacyService } from '../../../core/services/api/pharmacy.service';

@Component({
  selector: 'app-pharmacy-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Créer une nouvelle pharmacie</h2>
    
    <form [formGroup]="pharmacyForm" (ngSubmit)="onSubmit()">
      <div mat-dialog-content>
        <div class="loading-container" *ngIf="isLoading">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
        
        <div class="form-section">
          <h3>Informations de la pharmacie</h3>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nom de la pharmacie</mat-label>
            <input matInput formControlName="name" placeholder="Nom de la pharmacie">
            <mat-error *ngIf="pharmacyForm.get('name')?.hasError('required')">
              Le nom est requis
            </mat-error>
          </mat-form-field>
          
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="email@pharmacie.com">
              <mat-error *ngIf="pharmacyForm.get('email')?.hasError('required')">
                L'email est requis
              </mat-error>
              <mat-error *ngIf="pharmacyForm.get('email')?.hasError('email')">
                Veuillez entrer une adresse email valide
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Téléphone</mat-label>
              <input matInput formControlName="phone" placeholder="Téléphone">
              <mat-error *ngIf="pharmacyForm.get('phone')?.hasError('required')">
                Le téléphone est requis
              </mat-error>
            </mat-form-field>
          </div>
        </div>
        
        <div class="form-section">
          <h3>Adresse</h3>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Adresse</mat-label>
            <input matInput formControlName="address" placeholder="Adresse complète">
            <mat-error *ngIf="pharmacyForm.get('address')?.hasError('required')">
              L'adresse est requise
            </mat-error>
          </mat-form-field>
          
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Ville</mat-label>
              <input matInput formControlName="city" placeholder="Ville">
              <mat-error *ngIf="pharmacyForm.get('city')?.hasError('required')">
                La ville est requise
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Code postal</mat-label>
              <input matInput formControlName="zipCode" placeholder="Code postal">
              <mat-error *ngIf="pharmacyForm.get('zipCode')?.hasError('required')">
                Le code postal est requis
              </mat-error>
            </mat-form-field>
          </div>
        </div>
        
        <div class="form-section">
          <h3>Informations du responsable</h3>
          
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Prénom</mat-label>
              <input matInput formControlName="ownerFirstName" placeholder="Prénom du responsable">
              <mat-error *ngIf="pharmacyForm.get('ownerFirstName')?.hasError('required')">
                Le prénom du responsable est requis
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Nom</mat-label>
              <input matInput formControlName="ownerLastName" placeholder="Nom du responsable">
              <mat-error *ngIf="pharmacyForm.get('ownerLastName')?.hasError('required')">
                Le nom du responsable est requis
              </mat-error>
            </mat-form-field>
          </div>
        </div>
        
        <div class="form-section">
          <h3>Paramètres</h3>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Statut</mat-label>
            <mat-select formControlName="status">
              <mat-option value="pending">En attente</mat-option>
              <mat-option value="approved">Approuvée</mat-option>
              <mat-option value="rejected">Rejetée</mat-option>
            </mat-select>
            <mat-error *ngIf="pharmacyForm.get('status')?.hasError('required')">
              Le statut est requis
            </mat-error>
          </mat-form-field>
          
          <div class="checkbox-field">
            <mat-checkbox formControlName="isDeliveryAvailable">Livraison disponible</mat-checkbox>
          </div>
        </div>
      </div>
      
      <div mat-dialog-actions align="end">
        <button mat-button type="button" [disabled]="isLoading" (click)="onCancel()">Annuler</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="pharmacyForm.invalid || isLoading">
          Créer la pharmacie
        </button>
      </div>
    </form>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
    
    .form-section {
      margin-bottom: 24px;
    }
    
    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .full-width {
      width: 100%;
    }
    
    mat-form-field {
      width: 100%;
    }
    
    .checkbox-field {
      margin-top: 15px;
    }
  `]
})
export class PharmacyCreateDialogComponent implements OnInit {
  pharmacyForm: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PharmacyCreateDialogComponent>,
    private pharmacyService: PharmacyService,
    private snackBar: MatSnackBar
  ) {
    this.pharmacyForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required],
      ownerFirstName: ['', Validators.required],
      ownerLastName: ['', Validators.required],
      status: ['pending', Validators.required],
      isDeliveryAvailable: [true]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.pharmacyForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    
    // Format data for API
    const pharmacyData = {
      ...this.pharmacyForm.value,
      owner: {
        firstName: this.pharmacyForm.value.ownerFirstName,
        lastName: this.pharmacyForm.value.ownerLastName
      },
      location: {
        address: this.pharmacyForm.value.address,
        city: this.pharmacyForm.value.city,
        zipCode: this.pharmacyForm.value.zipCode
      }
    };
    
    // Remove fields that were moved to nested objects
    delete pharmacyData.ownerFirstName;
    delete pharmacyData.ownerLastName;
    delete pharmacyData.address;
    delete pharmacyData.city;
    delete pharmacyData.zipCode;
    
    this.pharmacyService.createPharmacy(pharmacyData).subscribe({
      next: (pharmacy) => {
        this.isLoading = false;
        this.snackBar.open('Pharmacie créée avec succès', 'Fermer', {
          duration: 3000
        });
        this.dialogRef.close(pharmacy);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating pharmacy:', error);
        this.snackBar.open(
          error.error?.message || 'Erreur lors de la création de la pharmacie', 
          'Fermer', 
          { duration: 5000 }
        );
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
