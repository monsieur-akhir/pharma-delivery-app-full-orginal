import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Medicine } from '../../../shared/models/medicine.model';
import { MedicineService } from '../../../core/services/api/medicine.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-medicine-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{isEditMode ? 'Modifier' : 'Ajouter'}} un médicament</h2>
    
    <div class="loading-container" *ngIf="isLoading">
      <mat-spinner diameter="40"></mat-spinner>
    </div>
    
    <form [formGroup]="medicineForm" *ngIf="!isLoading" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="name" required>
            <mat-error *ngIf="medicineForm.get('name')?.hasError('required')">
              Le nom est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nom générique</mat-label>
            <input matInput formControlName="generic_name" required>
            <mat-error *ngIf="medicineForm.get('generic_name')?.hasError('required')">
              Le nom générique est requis
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Fabricant</mat-label>
            <input matInput formControlName="manufacturer" required>
            <mat-error *ngIf="medicineForm.get('manufacturer')?.hasError('required')">
              Le fabricant est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Catégorie</mat-label>
            <mat-select formControlName="category" required>
              <mat-option *ngFor="let category of categories" [value]="category">
                {{category}}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="medicineForm.get('category')?.hasError('required')">
              La catégorie est requise
            </mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Prix</mat-label>
            <input matInput formControlName="price" type="number" min="0" required>
            <span matSuffix>€</span>
            <mat-error *ngIf="medicineForm.get('price')?.hasError('required')">
              Le prix est requis
            </mat-error>
            <mat-error *ngIf="medicineForm.get('price')?.hasError('min')">
              Le prix doit être positif
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Stock</mat-label>
            <input matInput formControlName="stock" type="number" min="0" required>
            <mat-error *ngIf="medicineForm.get('stock')?.hasError('required')">
              Le stock est requis
            </mat-error>
            <mat-error *ngIf="medicineForm.get('stock')?.hasError('min')">
              Le stock ne peut pas être négatif
            </mat-error>
          </mat-form-field>
        </div>

        <div class="checkbox-row">
          <mat-checkbox formControlName="requires_prescription">
            Prescription requise
          </mat-checkbox>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button 
          mat-raised-button 
          color="primary" 
          type="submit" 
          [disabled]="medicineForm.invalid || isSubmitting"
        >
          {{isSubmitting ? 'Sauvegarde...' : (isEditMode ? 'Mettre à jour' : 'Ajouter')}}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 10px;
    }
    
    .form-row > * {
      flex: 1;
    }
    
    .full-width {
      width: 100%;
    }
    
    .checkbox-row {
      margin: 10px 0;
    }
    
    mat-dialog-content {
      min-width: 500px;
    }
    
    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      mat-dialog-content {
        min-width: auto;
      }
    }
  `]
})
export class MedicineDialogComponent implements OnInit {
  medicineForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  categories: string[] = [];

  constructor(
    private fb: FormBuilder,
    private medicineService: MedicineService,
    private dialogRef: MatDialogRef<MedicineDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { medicine?: Medicine }
  ) {
    this.medicineForm = this.fb.group({
      name: ['', Validators.required],
      generic_name: ['', Validators.required],
      manufacturer: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      requires_prescription: [false],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
    });

    this.isEditMode = !!data?.medicine;
  }

  ngOnInit(): void {
    this.loadCategories();
    
    if (this.isEditMode && this.data.medicine) {
      this.medicineForm.patchValue(this.data.medicine);
    }
  }

  loadCategories(): void {
    this.isLoading = true;
    this.medicineService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load categories', error);
        this.isLoading = false;
        // Fallback categories
        this.categories = ['Analgésique', 'Antibiotique', 'Antihistaminique', 'Antihypertenseur', 'Autres'];
      }
    });
  }

  onSubmit(): void {
    if (this.medicineForm.invalid) return;

    const medicineData = this.medicineForm.value;
    this.isSubmitting = true;

    if (this.isEditMode) {
      this.medicineService.updateMedicine(this.data.medicine!.id, medicineData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Error updating medicine', error);
          this.isSubmitting = false;
        }
      });
    } else {
      this.medicineService.createMedicine(medicineData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Error creating medicine', error);
          this.isSubmitting = false;
        }
      });
    }
  }
}
