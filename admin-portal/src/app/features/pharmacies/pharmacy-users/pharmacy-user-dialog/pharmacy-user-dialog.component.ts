import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/api/user.service';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-pharmacy-user-dialog',
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
    <h2 mat-dialog-title>{{ isEditMode ? 'Modifier' : 'Ajouter' }} un utilisateur</h2>
    
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
          
          <mat-form-field appearance="outline" *ngIf="!isEditMode">
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
              <mat-option value="PHARMACY_ADMIN">Admin Pharmacie</mat-option>
              <mat-option value="PHARMACIST">Pharmacien</mat-option>
              <mat-option value="PHARMACY_STAFF">Personnel Pharmacie</mat-option>
            </mat-select>
            <mat-error *ngIf="userForm.get('role')?.hasError('required')">
              Le rôle est requis
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
          {{ isEditMode ? 'Enregistrer' : 'Ajouter' }}
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
      grid-column: span 2;
    }
    
    @media (max-width: 768px) {
      .checkbox-field {
        grid-column: span 1;
      }
    }
  `]
})
export class PharmacyUserDialogComponent implements OnInit {
  userForm: FormGroup;
  isLoading: boolean = false;
  isEditMode: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PharmacyUserDialogComponent>,
    private userService: UserService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { user?: User, pharmacyId: number }
  ) {
    this.isEditMode = !!data?.user;
    
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      username: ['', Validators.required],
      role: ['PHARMACY_STAFF', Validators.required],
      isActive: [true],
      pharmacyId: [data.pharmacyId]
    });
    
    if (!this.isEditMode) {
      // Ajout de champ mot de passe pour création uniquement
      this.userForm.addControl('password', this.fb.control('', [Validators.required, Validators.minLength(8)]));
    }
  }
  ngOnInit(): void {
    if (this.isEditMode && this.data.user) {
      // En mode édition, on remplit simplement le formulaire avec les données de l'utilisateur
      // No need to destructure password as it doesn't exist on User
      this.userForm.patchValue(this.data.user);
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    
    if (this.isEditMode) {
      this.userService.updateUser(Number(this.data.user!.id), this.userForm.value).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.snackBar.open('Utilisateur mis à jour avec succès', 'Fermer', {
            duration: 3000
          });
          this.dialogRef.close(user);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error updating user:', error);
          this.snackBar.open(
            error.error?.message || 'Erreur lors de la mise à jour de l\'utilisateur', 
            'Fermer', 
            { duration: 5000 }
          );
        }
      });
    } else {
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
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
