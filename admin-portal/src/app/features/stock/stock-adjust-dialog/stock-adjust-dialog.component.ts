import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MedicineStock, StockChangeReason } from '../../../core/models/stock.model';
import { StockService } from '../../../core/services/api/stock.service';

interface StockAdjustDialogData {
  stock: MedicineStock;
  medicineName: string;
}

@Component({
  selector: 'app-stock-adjust-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Ajuster le stock de {{ data.medicineName }}</h2>
    <div mat-dialog-content>
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <form [formGroup]="adjustForm" *ngIf="!isLoading">
        <div class="info-row">
          <span>Stock actuel: <strong>{{ data.stock.quantity }}</strong></span>
          <span>Seuil d'alerte: <strong>{{ data.stock.reorderLevel }}</strong></span>
        </div>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Type d'ajustement</mat-label>
          <mat-select formControlName="reason" required>
            <mat-option *ngFor="let reason of adjustmentReasons" [value]="reason.value">
              {{ reason.label }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="adjustForm.get('reason')?.hasError('required')">
            La raison de l'ajustement est requise
          </mat-error>
        </mat-form-field>
        
        <div class="quantity-controls">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Quantité</mat-label>
            <input matInput type="number" formControlName="quantity" required min="1">
            <mat-error *ngIf="adjustForm.get('quantity')?.hasError('required')">
              La quantité est requise
            </mat-error>
            <mat-error *ngIf="adjustForm.get('quantity')?.hasError('min')">
              La quantité doit être positive
            </mat-error>
          </mat-form-field>
          
          <div class="operation-toggle">
            <button [ngClass]="{ 'active': operation === 'add' }" (click)="setOperation('add')">Ajouter</button>
            <button [ngClass]="{ 'active': operation === 'remove' }" (click)="setOperation('remove')">Retirer</button>
            <button [ngClass]="{ 'active': operation === 'set' }" (click)="setOperation('set')">Définir</button>
          </div>
        </div>
        
        <div class="result-preview" *ngIf="adjustForm.valid">
          Nouveau stock prévu: <strong>{{ previewNewQuantity() }}</strong>
          <div class="stock-warning" *ngIf="previewNewQuantity() < data.stock.reorderLevel">
            Attention: Ce niveau est inférieur au seuil d'alerte!
          </div>
          <div class="stock-error" *ngIf="previewNewQuantity() < 0">
            Erreur: Le stock ne peut pas être négatif!
          </div>
        </div>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes (optionnel)</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="isLoading || adjustForm.invalid || previewNewQuantity() < 0" 
        (click)="onSubmit()">
        Confirmer
      </button>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      font-size: 16px;
    }
    
    .quantity-controls {
      margin-bottom: 15px;
    }
    
    .operation-toggle {
      display: flex;
      margin-top: 5px;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .operation-toggle button {
      flex: 1;
      padding: 8px;
      border: 1px solid #ccc;
      background: #f5f5f5;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .operation-toggle button.active {
      background: #3f51b5;
      color: white;
      border-color: #3f51b5;
    }
    
    .operation-toggle button:first-child {
      border-radius: 4px 0 0 4px;
    }
    
    .operation-toggle button:last-child {
      border-radius: 0 4px 4px 0;
    }
    
    .result-preview {
      margin-bottom: 15px;
      padding: 10px;
      background: #f8f8f8;
      border-radius: 4px;
      font-size: 16px;
    }
    
    .stock-warning {
      margin-top: 5px;
      color: #ff9800;
      font-weight: 500;
    }
    
    .stock-error {
      margin-top: 5px;
      color: #f44336;
      font-weight: 500;
    }
  `]
})
export class StockAdjustDialogComponent {
  adjustForm: FormGroup;
  isLoading = false;
  operation: 'add' | 'remove' | 'set' = 'add';
  
  adjustmentReasons = [
    { value: StockChangeReason.PURCHASE, label: 'Achat / Approvisionnement' },
    { value: StockChangeReason.SALE, label: 'Vente' },
    { value: StockChangeReason.RETURN, label: 'Retour client' },
    { value: StockChangeReason.ADJUSTMENT, label: 'Ajustement manuel (inventaire)' },
    { value: StockChangeReason.EXPIRY, label: 'Expiration' },
    { value: StockChangeReason.DAMAGE, label: 'Dommage / Perte' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<StockAdjustDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockAdjustDialogData
  ) {
    this.adjustForm = this.fb.group({
      reason: [StockChangeReason.ADJUSTMENT, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      notes: ['']
    });
    
    // Pré-sélectionner le type d'opération en fonction de la raison
    this.adjustForm.get('reason')?.valueChanges.subscribe(reason => {
      if (reason === StockChangeReason.PURCHASE || reason === StockChangeReason.RETURN) {
        this.setOperation('add');
      } else if (reason === StockChangeReason.SALE || reason === StockChangeReason.EXPIRY || reason === StockChangeReason.DAMAGE) {
        this.setOperation('remove');
      }
    });
  }
  
  setOperation(op: 'add' | 'remove' | 'set'): void {
    this.operation = op;
  }
  
  previewNewQuantity(): number {
    const currentQuantity = this.data.stock.quantity;
    const adjustQuantity = this.adjustForm.get('quantity')?.value || 0;
    
    switch (this.operation) {
      case 'add':
        return currentQuantity + adjustQuantity;
      case 'remove':
        return currentQuantity - adjustQuantity;
      case 'set':
        return adjustQuantity;
      default:
        return currentQuantity;
    }
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onSubmit(): void {
    if (this.adjustForm.invalid || this.previewNewQuantity() < 0) return;
    
    this.isLoading = true;
    
    // Calculer la quantité à envoyer à l'API
    const currentQuantity = this.data.stock.quantity;
    let quantity: number;
    
    switch (this.operation) {
      case 'add':
        quantity = this.adjustForm.value.quantity; // Valeur positive pour ajouter
        break;
      case 'remove':
        quantity = -this.adjustForm.value.quantity; // Valeur négative pour retirer
        break;
      case 'set':
        quantity = this.adjustForm.value.quantity - currentQuantity; // Différence entre valeur actuelle et nouvelle valeur
        break;
      default:
        quantity = 0;
    }
    
    this.stockService.adjustStockQuantity(
      this.data.stock.id,
      quantity,
      this.adjustForm.value.reason,
      this.adjustForm.value.notes
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Stock ajusté avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error adjusting stock', error);
        this.snackBar.open('Erreur lors de l\'ajustement du stock', 'Fermer', { duration: 3000 });
      }
    });
  }
}
