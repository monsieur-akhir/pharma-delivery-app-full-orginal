import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MedicineService } from '../../../core/services/api/medicine.service';
import { StockService } from '../../../core/services/api/stock.service';
import { Medicine } from '../../../core/models/medicine.model';

export interface AddMedicineToStockDialogData {
  pharmacyId: number;
  pharmacyName: string;
}

@Component({
  selector: 'app-add-medicine-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>Ajouter un médicament au stock</h2>
    
    <div class="loading-container" *ngIf="isLoading">
      <mat-spinner diameter="40"></mat-spinner>
    </div>
    
    <form [formGroup]="stockForm" *ngIf="!isLoading" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="pharmacy-info">
          <p><strong>Pharmacie:</strong> {{ data.pharmacyName }}</p>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Médicament</mat-label>
          <input type="text" 
                 matInput 
                 formControlName="medicineCtrl" 
                 [matAutocomplete]="auto">
          <mat-autocomplete #auto="matAutocomplete" 
                           [displayWith]="displayMedicine"
                           (optionSelected)="onMedicineSelected($event)">
            <mat-option *ngFor="let medicine of filteredMedicines | async" [value]="medicine">
              {{ medicine.name }} ({{ medicine.genericName }})
            </mat-option>
          </mat-autocomplete>
          <mat-error *ngIf="stockForm.get('medicineCtrl')?.hasError('required')">
            Le médicament est requis
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Quantité</mat-label>
          <input matInput type="number" formControlName="quantity" min="1">
          <mat-error *ngIf="stockForm.get('quantity')?.hasError('required')">
            La quantité est requise
          </mat-error>
          <mat-error *ngIf="stockForm.get('quantity')?.hasError('min')">
            La quantité doit être supérieure à 0
          </mat-error>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Niveau de réapprovisionnement</mat-label>
            <input matInput type="number" formControlName="reorderLevel" min="1">
            <mat-error *ngIf="stockForm.get('reorderLevel')?.hasError('required')">
              Le niveau de réapprovisionnement est requis
            </mat-error>
            <mat-error *ngIf="stockForm.get('reorderLevel')?.hasError('min')">
              Le niveau doit être supérieur à 0
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Stock idéal</mat-label>
            <input matInput type="number" formControlName="idealStock" min="1">
            <mat-error *ngIf="stockForm.get('idealStock')?.hasError('required')">
              Le stock idéal est requis
            </mat-error>
            <mat-error *ngIf="stockForm.get('idealStock')?.hasError('min')">
              Le stock idéal doit être supérieur à 0
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Numéro de lot (optionnel)</mat-label>
            <input matInput formControlName="batchNumber">
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Date d'expiration (optionnel)</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="expiryDate">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="false">Annuler</button>
        <button 
          mat-raised-button 
          color="primary" 
          type="submit" 
          [disabled]="stockForm.invalid || isSubmitting"
        >
          <span *ngIf="isSubmitting">Ajout en cours...</span>
          <span *ngIf="!isSubmitting">Ajouter au stock</span>
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .half-width {
      width: 48%;
    }
    
    .form-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    
    .pharmacy-info {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
  `]
})
export class AddMedicineDialogComponent implements OnInit {
  stockForm: FormGroup;
  medicines: Medicine[] = [];
  filteredMedicines: Observable<Medicine[]>;
  isLoading = true;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddMedicineDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddMedicineToStockDialogData,
    private medicineService: MedicineService,
    private stockService: StockService,
    private snackBar: MatSnackBar
  ) {
    this.stockForm = this.fb.group({
      medicineCtrl: ['', Validators.required],
      medicineId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reorderLevel: [5, [Validators.required, Validators.min(1)]],
      idealStock: [20, [Validators.required, Validators.min(1)]],
      batchNumber: [''],
      expiryDate: [null]
    });

    this.filteredMedicines = this.stockForm.get('medicineCtrl')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterMedicines(name) : this.medicines.slice();
      })
    );
  }

  ngOnInit(): void {
    this.loadMedicines();
  }

  loadMedicines(): void {
    this.isLoading = true;
    this.medicineService.getMedicines({ limit: 100 }).subscribe({
      next: (response) => {
        this.medicines = response.medicines;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des médicaments', error);
        this.snackBar.open('Impossible de charger la liste des médicaments', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
        this.dialogRef.close();
      }
    });
  }

  displayMedicine(medicine: Medicine): string {
    return medicine ? `${medicine.name} (${medicine.genericName})` : '';
  }

  onMedicineSelected(event: any): void {
    const medicine = event.option.value as Medicine;
    this.stockForm.get('medicineId')?.setValue(medicine.id);
  }

  private _filterMedicines(value: string): Medicine[] {
    const filterValue = value.toLowerCase();
    return this.medicines.filter(medicine => 
      medicine.name.toLowerCase().includes(filterValue) || 
      medicine.genericName.toLowerCase().includes(filterValue)
    );
  }

  onSubmit(): void {
    if (this.stockForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.stockForm.value;
    
    const stockData = {
      quantity: formValue.quantity,
      reorderLevel: formValue.reorderLevel,
      idealStock: formValue.idealStock,
      batchNumber: formValue.batchNumber || undefined,
      expiryDate: formValue.expiryDate || undefined
    };
    
    this.stockService.addMedicineToStock(
      this.data.pharmacyId,
      formValue.medicineId,
      stockData
    ).subscribe({
      next: (result) => {
        this.snackBar.open('Médicament ajouté au stock avec succès', 'Fermer', {
          duration: 3000
        });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du médicament au stock', error);
        this.snackBar.open('Erreur lors de l\'ajout du médicament au stock', 'Fermer', {
          duration: 3000
        });
        this.isSubmitting = false;
      }
    });
  }
}
