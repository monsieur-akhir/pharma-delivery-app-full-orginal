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
import { UserService } from '../../../core/services/api/user.service';
import { PharmacyService } from '../../../core/services/api/pharmacy.service';

@Component({
  selector: 'app-user-create-dialog',
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
    <h2 mat-dialog-title>Créer un nouvel utilisateur</h2>
    
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <div mat-dialog-content>
        <div class="loading-container" *ngIf="isLoading">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
        
        <div class="form-grid">
          <!-- Informations personnelles -->
          <mat-form-field appearance="outline">
            <mat-label>Prénom</mat-label>
            <input matInput formControlName="firstName" placeholder="Prénom">
            <mat-error *ngIf="userForm.get('firstName')?.hasError('required')">
              Le prénom est requis
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="lastName" placeholder="Nom">
            <mat-error *ngIf="userForm.get('lastName')?.hasError('required')">
              Le nom est requis
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" placeholder="example@mail.com" type="email">
            <mat-error *ngIf="userForm.get('email')?.hasError('required')">
              L'email est requis
            </mat-error>
            <mat-error *ngIf="userForm.get('email')?.hasError('email')">
              Veuillez entrer une adresse email valide
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Téléphone</mat-label>
            <input matInput formControlName="phone" placeholder="Téléphone">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Nom d'utilisateur</mat-label>
            <input matInput formControlName="username" placeholder="Nom d'utilisateur">
            <mat-error *ngIf="userForm.get('username')?.hasError('required')">
              Le nom d'utilisateur est requis
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Mot de passe</mat-label>
            <input matInput formControlName="password" type="password" placeholder="Mot de passe">
            <mat-error *ngIf="userForm.get('password')?.hasError('required')">
              Le mot de passe est requis
            </mat-error>
            <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">
              Le mot de passe doit contenir au moins 8 caractères
            </mat-error>
          </mat-form-field>
            <mat-form-field appearance="outline">
            <mat-label>Rôle</mat-label>
            <mat-select formControlName="role">
              <mat-option value="ADMIN">Administrateur</mat-option>
              <mat-option value="USER">Utilisateur</mat-option>
              <mat-option value="PHARMACY_ADMIN">Admin Pharmacie</mat-option>
              <mat-option value="PHARMACY_STAFF">Personnel Pharmacie</mat-option>
              <mat-option value="PHARMACIST">Pharmacien</mat-option>
              <mat-option value="DELIVERY_PERSON">Livreur</mat-option>
            </mat-select>
            <mat-error *ngIf="userForm.get('role')?.hasError('required')">
              Le rôle est requis
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline" *ngIf="showPharmacyField">
            <mat-label>Pharmacie</mat-label>
            <mat-select formControlName="pharmacyId">
              <mat-option *ngFor="let pharmacy of pharmacies" [value]="pharmacy.id">
                {{pharmacy.name}}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="userForm.get('pharmacyId')?.hasError('required')">
              La pharmacie est requise pour ce rôle
            </mat-error>
          </mat-form-field>
          
          <div class="checkbox-field">
            <mat-checkbox formControlName="isActive">Compte actif</mat-checkbox>
          </div>
        </div>
      </div>
      
      <div mat-dialog-actions align="end">
        <button mat-button type="button" [disabled]="isLoading" (click)="onCancel()">Annuler</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="userForm.invalid || isLoading">
          Créer l'utilisateur
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
    
    mat-form-field {
      width: 100%;
    }
    
    .checkbox-field {
      margin-top: 15px;
    }
  `]
})
export class UserCreateDialogComponent implements OnInit {
  userForm: FormGroup;
  isLoading: boolean = false;
  pharmacies: any[] = [];
  showPharmacyField: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserCreateDialogComponent>,
    private userService: UserService,
    private pharmacyService: PharmacyService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['USER', Validators.required],
      isActive: [true],
      pharmacyId: [null]
    });

    // Afficher le champ pharmacie seulement pour certains rôles
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      this.showPharmacyField = ['PHARMACY_ADMIN', 'PHARMACIST', 'PHARMACY_STAFF'].includes(role);
      
      const pharmacyIdControl = this.userForm.get('pharmacyId');
      if (this.showPharmacyField) {
        pharmacyIdControl?.setValidators([Validators.required]);
      } else {
        pharmacyIdControl?.clearValidators();
        pharmacyIdControl?.setValue(null);
      }
      pharmacyIdControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadPharmacies();
  }
  
  loadPharmacies(): void {
    this.isLoading = true;
    this.pharmacyService.getPharmacies(1, 100, 'APPROVED').subscribe({
      next: (response) => {
        this.pharmacies = response.pharmacies;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pharmacies', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des pharmacies', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    
    this.userService.createUser(this.userForm.value).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.snackBar.open('Utilisateur créé avec succès', 'Fermer', {
          duration: 3000
        });
        this.dialogRef.close(user);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating user:', error);
        this.snackBar.open(
          error.error?.message || 'Erreur lors de la création de l\'utilisateur', 
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
