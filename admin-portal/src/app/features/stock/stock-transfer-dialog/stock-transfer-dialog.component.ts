import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MedicineStock } from '../../../core/models/stock.model';
import { StockService } from '../../../core/services/api/stock.service';
import { PharmacyService } from '../../../core/services/api/pharmacy.service';
import { Pharmacy } from '../../../core/models/pharmacy.model';

export interface StockTransferDialogData {
  stock: MedicineStock;
}

@Component({
  selector: 'app-stock-transfer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Transférer du stock</h2>
    
    <div class="loading-container" *ngIf="isLoading">
      <mat-spinner diameter="40"></mat-spinner>
    </div>
    
    <form [formGroup]="transferForm" *ngIf="!isLoading" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="stock-info">
          <p><strong>Médicament:</strong> {{ data.stock.medicine?.name }}</p>
          <p><strong>Pharmacie source:</strong> {{ data.stock.pharmacy?.name }}</p>
          <p><strong>Quantité disponible:</strong> {{ data.stock.quantity }}</p>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Pharmacie destinataire</mat-label>
          <mat-select formControlName="destinationPharmacyId">
            <mat-option *ngFor="let pharmacy of pharmacies" [value]="pharmacy.id">
              {{ pharmacy.name }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="transferForm.get('destinationPharmacyId')?.hasError('required')">
            La pharmacie destinataire est requise
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Quantité à transférer</mat-label>
          <input matInput type="number" formControlName="quantity" min="1" [max]="data.stock.quantity">
          <mat-error *ngIf="transferForm.get('quantity')?.hasError('required')">
            La quantité est requise
          </mat-error>
          <mat-error *ngIf="transferForm.get('quantity')?.hasError('min')">
            La quantité doit être supérieure à 0
          </mat-error>
          <mat-error *ngIf="transferForm.get('quantity')?.hasError('max')">
            La quantité ne peut pas dépasser le stock disponible
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes (optionnel)</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="false">Annuler</button>
        <button 
          mat-raised-button 
          color="primary" 
          type="submit" 
          [disabled]="transferForm.invalid || isSubmitting"
        >
          <span *ngIf="isSubmitting">Transfert en cours...</span>
          <span *ngIf="!isSubmitting">Transférer</span>
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .stock-info {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    .stock-info p {
      margin: 5px 0;
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
export class StockTransferDialogComponent implements OnInit {
  transferForm: FormGroup;
  pharmacies: Pharmacy[] = [];
  isLoading = true;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<StockTransferDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockTransferDialogData,
    private stockService: StockService,
    private pharmacyService: PharmacyService,
    private snackBar: MatSnackBar
  ) {
    this.transferForm = this.fb.group({
      destinationPharmacyId: ['', Validators.required],
      quantity: [1, [
        Validators.required, 
        Validators.min(1), 
        Validators.max(this.data.stock.quantity)
      ]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadPharmacies();
  }

  loadPharmacies(): void {
    this.isLoading = true;
    // Exclure la pharmacie source des options
    this.pharmacyService.getPharmacies().subscribe({
      next: (response) => {
        this.pharmacies = response.pharmacies.filter((p: any) => p.id !== this.data.stock.pharmacyId);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des pharmacies', error);
        this.snackBar.open('Impossible de charger la liste des pharmacies', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
        this.dialogRef.close();
      }
    });
  }

  onSubmit(): void {
    if (this.transferForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.transferForm.value;
    
    this.stockService.transferStock(
      this.data.stock.id,
      formValue.destinationPharmacyId,
      formValue.quantity,
      formValue.notes
    ).subscribe({
      next: (result) => {
        this.snackBar.open('Transfert de stock effectué avec succès', 'Fermer', {
          duration: 3000
        });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Erreur lors du transfert de stock', error);
        this.snackBar.open('Erreur lors du transfert de stock', 'Fermer', {
          duration: 3000
        });
        this.isSubmitting = false;
      }
    });
  }
}
