import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface OtpDialogData {
  username: string;
  returnUrl?: string;
  isPasswordReset?: boolean;
  title?: string;
  message?: string;
}

@Component({
  selector: 'app-otp-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule
  ],  template: `
    <h2 mat-dialog-title>{{ data.title || 'Vérification en deux étapes' }}</h2>
    <mat-dialog-content>
      <p>{{ data.message || 'Un code de vérification a été envoyé à votre adresse email/téléphone.' }}</p>
      <p class="subtitle">Veuillez saisir le code à 6 chiffres ci-dessous</p>

      <form [formGroup]="otpForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code OTP</mat-label>
          <input matInput formControlName="otp" placeholder="Entrez le code à 6 chiffres" maxlength="6" autocomplete="off">
          <mat-icon matPrefix>lock</mat-icon>
          <mat-error *ngIf="otpForm.get('otp')?.hasError('required')">
            Le code OTP est requis
          </mat-error>
          <mat-error *ngIf="otpForm.get('otp')?.hasError('minlength') || otpForm.get('otp')?.hasError('maxlength')">
            Le code OTP doit contenir 6 chiffres
          </mat-error>
        </mat-form-field>

        <div *ngIf="errorMessage" class="error-message">
          <mat-icon>error</mat-icon>
          <span>{{ errorMessage }}</span>
        </div>
      </form>

      <div class="resend-section">
        <span>Vous n'avez pas reçu de code? </span>
        <button mat-button color="primary" (click)="resendOtp()" [disabled]="isResending">
          Renvoyer le code
        </button>
      </div>

      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="verifyOtp()" [disabled]="isLoading || otpForm.invalid">
        Vérifier
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 400px;
    }

    .full-width {
      width: 100%;
    }

    .subtitle {
      margin-bottom: 20px;
      color: rgba(0, 0, 0, 0.6);
    }

    .error-message {
      display: flex;
      align-items: center;
      color: #f44336;
      margin-bottom: 15px;
    }

    .error-message mat-icon {
      margin-right: 8px;
      font-size: 20px;
    }

    .resend-section {
      margin-top: 20px;
      display: flex;
      align-items: center;
      font-size: 14px;
    }
  `]
})
export class OtpDialogComponent implements OnInit {
  otpForm: FormGroup;
  isLoading = false;
  isResending = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<OtpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OtpDialogData
  ) {
    this.otpForm = this.fb.group({
      otp: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern('^[0-9]*$')
      ]]
    });
  }

  ngOnInit(): void { }

  verifyOtp(): void {
    if (this.otpForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const otp = this.otpForm.get('otp')?.value;
    this.dialogRef.close({ otp });
  }

  resendOtp(): void {
    this.isResending = true;
    this.errorMessage = '';
    
    // Pour simuler l'envoi
    setTimeout(() => {
      this.isResending = false;
    }, 2000);
    
    // L'événement de renvoi sera géré par le composant parent
    this.dialogRef.close({ resend: true });
  }
}
