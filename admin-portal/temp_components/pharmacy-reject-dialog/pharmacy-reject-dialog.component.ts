import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

export interface PharmacyRejectDialogData {
  pharmacyId: number;
  pharmacyName: string;
}

@Component({
  selector: 'app-pharmacy-reject-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Rejeter la pharmacie "{{ data.pharmacyName }}"</h2>
    <mat-dialog-content>
      <form [formGroup]="rejectForm">
        <p>
          Veuillez fournir une raison pour le rejet de cette demande de pharmacie.
          Cette information sera communiquée au propriétaire.
        </p>
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Raison du rejet</mat-label>
          <textarea 
            matInput 
            formControlName="reason"
            placeholder="Ex: Licence invalide, informations incomplètes..." 
            rows="5"></textarea>
          <mat-error *ngIf="rejectForm.controls.reason.hasError('required')">
            La raison du rejet est obligatoire
          </mat-error>
          <mat-error *ngIf="rejectForm.controls.reason.hasError('minlength')">
            La raison doit contenir au moins 10 caractères
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button 
        mat-raised-button 
        color="warn"
        [disabled]="rejectForm.invalid"
        (click)="onSubmit()">
        Confirmer le rejet
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    mat-dialog-content {
      min-width: 350px;
    }
  `]
})
export class PharmacyRejectDialogComponent {
  rejectForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<PharmacyRejectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PharmacyRejectDialogData
  ) {
    this.rejectForm = new FormGroup({
      reason: new FormControl('', [
        Validators.required,
        Validators.minLength(10)
      ])
    });
  }

  onSubmit(): void {
    if (this.rejectForm.valid) {
      this.dialogRef.close(this.rejectForm.get('reason')?.value);
    }
  }
}
