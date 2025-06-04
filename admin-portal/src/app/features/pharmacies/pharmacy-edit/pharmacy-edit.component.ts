import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PharmaciesService } from '../pharmacies.service';
import { Pharmacy, PharmacyStatus } from '../../../core/models/pharmacy.model';

@Component({
  selector: 'app-pharmacy-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="pharmacy-edit-container">
      <h1>{{ isNewPharmacy ? 'Ajouter une pharmacie' : 'Modifier la pharmacie' }}</h1>
      
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Chargement en cours...</p>
      </div>
      
      <mat-card *ngIf="!isLoading">
        <mat-card-content>
          <form [formGroup]="pharmacyForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Nom</mat-label>
                <input matInput formControlName="name" placeholder="Nom de la pharmacie" required>
                <mat-error *ngIf="pharmacyForm.get('name')?.hasError('required')">
                  Le nom est requis
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" placeholder="Email" type="email" required>
                <mat-error *ngIf="pharmacyForm.get('email')?.hasError('required')">
                  L'email est requis
                </mat-error>
                <mat-error *ngIf="pharmacyForm.get('email')?.hasError('email')">
                  Format d'email invalide
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Téléphone</mat-label>
                <input matInput formControlName="phone" placeholder="Téléphone" required>
                <mat-error *ngIf="pharmacyForm.get('phone')?.hasError('required')">
                  Le téléphone est requis
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Numéro de licence</mat-label>
                <input matInput formControlName="licenseNumber" placeholder="Numéro de licence" required>
                <mat-error *ngIf="pharmacyForm.get('licenseNumber')?.hasError('required')">
                  Le numéro de licence est requis
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Adresse</mat-label>
                <input matInput formControlName="address" placeholder="Adresse" required>
                <mat-error *ngIf="pharmacyForm.get('address')?.hasError('required')">
                  L'adresse est requise
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Ville</mat-label>
                <input matInput formControlName="city" placeholder="Ville" required>
                <mat-error *ngIf="pharmacyForm.get('city')?.hasError('required')">
                  La ville est requise
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Pays</mat-label>
                <input matInput formControlName="country" placeholder="Pays" required>
                <mat-error *ngIf="pharmacyForm.get('country')?.hasError('required')">
                  Le pays est requis
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Nom du propriétaire</mat-label>
                <input matInput formControlName="ownerName" placeholder="Nom du propriétaire">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Statut</mat-label>
                <mat-select formControlName="status" required>
                  <mat-option value="PENDING">En attente</mat-option>
                  <mat-option value="APPROVED">Approuvé</mat-option>
                  <mat-option value="SUSPENDED">Suspendu</mat-option>
                  <mat-option value="REJECTED">Rejeté</mat-option>
                </mat-select>
                <mat-error *ngIf="pharmacyForm.get('status')?.hasError('required')">
                  Le statut est requis
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Heures d'ouverture</mat-label>
                <input matInput formControlName="openingHours" placeholder="Heures d'ouverture">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Site web</mat-label>
                <input matInput formControlName="websiteUrl" placeholder="Site web">
              </mat-form-field>
            </div>
            
            <div class="form-row full-width">
              <mat-form-field appearance="outline">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="4" placeholder="Description de la pharmacie"></textarea>
              </mat-form-field>
            </div>
            
            <div class="actions">
              <button type="button" mat-button (click)="goBack()">Annuler</button>
              <button type="submit" mat-raised-button color="primary" [disabled]="pharmacyForm.invalid || isSaving">
                {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .pharmacy-edit-container {
      padding: 20px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 50px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }
    
    .form-row mat-form-field {
      flex: 1;
    }
    
    .full-width {
      flex-direction: column;
    }
    
    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
      gap: 10px;
    }
    
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class PharmacyEditComponent implements OnInit {
  pharmacyId?: number;
  pharmacyForm: FormGroup;
  isLoading = false;
  isSaving = false;
  isNewPharmacy = true;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private pharmaciesService: PharmaciesService,
    private snackBar: MatSnackBar
  ) {
    this.pharmacyForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      ownerName: [''],
      status: ['PENDING', Validators.required],
      openingHours: [''],
      websiteUrl: [''],
      description: ['']
    });
  }
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.pharmacyId = +params['id'];
        this.isNewPharmacy = false;
        this.loadPharmacy();
      }
    });
  }
  
  loadPharmacy(): void {
    if (!this.pharmacyId) return;
    
    this.isLoading = true;
    this.pharmaciesService.getPharmacyById(this.pharmacyId).subscribe({
      next: (pharmacy) => {
        // Adaptation du modèle de l'API au formulaire
        this.pharmacyForm.patchValue({
          name: pharmacy.name,
          email: pharmacy.email,
          phone: pharmacy.phone,
          licenseNumber: pharmacy.licenseNumber,
          address: pharmacy.address,
          city: pharmacy.city,
          country: pharmacy.country,
          ownerName: pharmacy.ownerName,
          status: pharmacy.status,
          openingHours: pharmacy.operatingHours,
          websiteUrl: pharmacy.websiteUrl || '',
          description: pharmacy.description || ''
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pharmacy:', error);
        this.snackBar.open('Erreur lors du chargement de la pharmacie', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
        this.goBack();
      }
    });
  }
  
  onSubmit(): void {
    if (this.pharmacyForm.invalid) return;
    
    this.isSaving = true;
    
    const formValue = this.pharmacyForm.value;
    
    // Adapter les noms de champs entre le formulaire et l'API
    const pharmacyData = {
      ...formValue,
      operatingHours: formValue.openingHours
    };
    
    const request = this.isNewPharmacy
      ? this.pharmaciesService.createPharmacy(pharmacyData)
      : this.pharmaciesService.updatePharmacy(this.pharmacyId!, pharmacyData);
      
    request.subscribe({
      next: (pharmacy) => {
        this.isSaving = false;
        this.snackBar.open(
          this.isNewPharmacy ? 'Pharmacie créée avec succès' : 'Pharmacie mise à jour avec succès',
          'Fermer',
          { duration: 3000 }
        );
        this.router.navigate(['/pharmacies']);
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error saving pharmacy:', error);
        this.snackBar.open('Erreur lors de l\'enregistrement de la pharmacie', 'Fermer', {
          duration: 3000
        });
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/pharmacies']);
  }
}
