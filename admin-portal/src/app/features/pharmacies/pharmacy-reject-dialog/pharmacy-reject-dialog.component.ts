// filepath: e:\pharma-delivery-app-full\admin-portal\src\app\features\pharmacies\pharmacy-reject-dialog\pharmacy-reject-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface PharmacyRejectDialogData {
  pharmacyId: number;
  pharmacyName: string;
}

@Component({
  selector: 'app-pharmacy-reject-dialog',
  templateUrl: './pharmacy-reject-dialog.component.html',
  styleUrls: ['./pharmacy-reject-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class PharmacyRejectDialogComponent {
  reasonControl = new FormControl('', [Validators.required, Validators.minLength(5)]);

  constructor(
    public dialogRef: MatDialogRef<PharmacyRejectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PharmacyRejectDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.reasonControl.valid) {
      this.dialogRef.close(this.reasonControl.value);
    } else {
      this.reasonControl.markAsTouched();
    }
  }
}
