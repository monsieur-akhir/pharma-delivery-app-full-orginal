import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],  template: `
    <div class="reset-container auth-page">
      <div class="reset-content">
        <div class="logo-container">
          <img src="assets/logo.png" alt="Logo" class="login-logo">
          <h1 class="app-title">Pharmacy Admin Portal</h1>
        </div>
        
        <mat-card class="reset-card">
          <div class="card-header-bg"></div>
          <mat-card-header>
            <mat-card-title>Réinitialisation du mot de passe</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div *ngIf="!showResetForm" class="step-container">
              <p class="instruction-text">Veuillez saisir le code de réinitialisation reçu par email ou SMS.</p>
              
              <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()">
                <mat-form-field appearance="outline" class="full-width identifier-field">
                  <mat-label>Identifiant / Email / Téléphone</mat-label>
                  <input matInput formControlName="identifier" placeholder="Entrez votre identifiant" required readonly>
                  <mat-icon matPrefix>person</mat-icon>
                </mat-form-field>
                
                <div class="otp-container">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Code de réinitialisation</mat-label>
                    <input matInput formControlName="resetCode" placeholder="Entrez le code à 6 chiffres" required autocomplete="off">
                    <mat-icon matPrefix>vpn_key</mat-icon>
                  </mat-form-field>
                </div>
                
                <div *ngIf="errorMessage" class="error-message">
                  <mat-icon>error</mat-icon>
                  <span>{{ errorMessage }}</span>
                </div>
                
                <div class="button-container">
                  <button mat-flat-button color="primary" type="submit" [disabled]="isLoading || otpForm.invalid">
                    Vérifier le code
                  </button>
                  <button mat-stroked-button type="button" (click)="resendResetCode()" [disabled]="isLoading">
                    Renvoyer le code
                  </button>
                </div>
                
                <mat-progress-bar *ngIf="isLoading" mode="indeterminate" class="progress-bar"></mat-progress-bar>
              </form>
            </div>
              <div *ngIf="showResetForm" class="step-container">
              <div class="success-step">
                <mat-icon class="success-icon">check_circle</mat-icon>
                <p class="success-message">Votre code a été vérifié avec succès !</p>
              </div>
              <p class="instruction-text">Veuillez choisir un nouveau mot de passe sécurisé</p>
              
              <form [formGroup]="resetForm" (ngSubmit)="resetPassword()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nouveau mot de passe</mat-label>
                  <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="newPassword" placeholder="Entrez votre nouveau mot de passe" required>
                  <mat-icon matPrefix>lock</mat-icon>
                  <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
                    <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                  <mat-error *ngIf="resetForm.get('newPassword')?.hasError('required')">
                    Le mot de passe est requis
                  </mat-error>
                  <mat-error *ngIf="resetForm.get('newPassword')?.hasError('minlength')">
                    Le mot de passe doit contenir au moins 8 caractères
                  </mat-error>
                  <mat-error *ngIf="resetForm.get('newPassword')?.hasError('pattern')">
                    Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre
                  </mat-error>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Confirmez le mot de passe</mat-label>
                  <input matInput [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="confirmPassword" placeholder="Confirmez votre mot de passe" required>
                  <mat-icon matPrefix>lock</mat-icon>
                  <button type="button" mat-icon-button matSuffix (click)="hideConfirmPassword = !hideConfirmPassword">
                    <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                  <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('required')">
                    La confirmation du mot de passe est requise
                  </mat-error>
                  <mat-error *ngIf="resetForm.hasError('passwordMismatch') && resetForm.get('confirmPassword')?.touched">
                    Les mots de passe ne correspondent pas
                  </mat-error>
                </mat-form-field>
                
                <div class="password-requirements">
                  <div class="requirement-title">Exigences de mot de passe:</div>                  <div class="requirement" [ngClass]="{'met': hasMinLength()}">
                    <mat-icon>{{ hasMinLength() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <span>Au moins 8 caractères</span>
                  </div>
                  <div class="requirement" [ngClass]="{'met': hasUpperCase()}">
                    <mat-icon>{{ hasUpperCase() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <span>Au moins une lettre majuscule</span>
                  </div>
                  <div class="requirement" [ngClass]="{'met': hasLowerCase()}">
                    <mat-icon>{{ hasLowerCase() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <span>Au moins une lettre minuscule</span>
                  </div>
                  <div class="requirement" [ngClass]="{'met': hasDigit()}">
                    <mat-icon>{{ hasDigit() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <span>Au moins un chiffre</span>
                  </div>
                </div>
                
                <div *ngIf="errorMessage" class="error-message">
                  <mat-icon>error</mat-icon>
                  <span>{{ errorMessage }}</span>
                </div>
                
                <div class="button-container">
                  <button mat-flat-button color="primary" type="submit" [disabled]="isLoading || resetForm.invalid">
                    <mat-icon>lock_reset</mat-icon>
                    Réinitialiser le mot de passe
                  </button>
                </div>
                
                <mat-progress-bar *ngIf="isLoading" mode="indeterminate" class="progress-bar"></mat-progress-bar>
              </form>
            </div></mat-card-content>
          
          <mat-card-actions align="end">
            <button mat-button color="primary" routerLink="/login">
              Retour à la connexion
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,  styles: [`
    .reset-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a237e, #3949ab);
      padding: 20px;
      animation: gradientShift 15s ease infinite;
    }
    
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .reset-content {
      max-width: 500px;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    
    .logo-container {
      text-align: center;
      margin-bottom: 20px;
    }    
    .login-logo {
      width: 80px;
      margin-bottom: 15px;
      filter: drop-shadow(0 0 8px rgba(255,255,255,0.6));
    }
    
    .app-title {
      font-size: 28px;
      margin: 0;
      font-weight: 500;
      color: #ffffff;
      text-shadow: 0 0 10px rgba(255,255,255,0.3);
      letter-spacing: 1px;
    }
    
    .reset-card {
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      overflow: hidden;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .card-header-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(to right, #4a148c, #7b1fa2, #e91e63);
      z-index: 1;
    }
    
    mat-card-header {
      margin-bottom: 20px;
      padding-top: 20px;
      position: relative;
      z-index: 2;
    }
    
    mat-card-title {
      color: #1a237e;
      font-size: 24px;
      font-weight: 500;
    }
    
    .instruction-text {
      color: #546e7a;
      font-size: 16px;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .identifier-field {
      background-color: #f5f5f5;
      border-radius: 8px;
    }
    
    .otp-container {
      margin: 20px 0;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      color: #f44336;
      margin: 15px 0;
      background-color: rgba(244, 67, 54, 0.1);
      padding: 10px 15px;
      border-radius: 8px;
      animation: shake 0.6s ease-in-out;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .error-message mat-icon {
      margin-right: 10px;
      font-size: 20px;
    }
    
    .step-container {
      margin-top: 15px;
      padding: 10px;
    }
    
    .button-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      gap: 10px;
    }
    
    .button-container button {
      min-width: 140px;
      height: 44px;
      border-radius: 22px;
      font-weight: 500;
      letter-spacing: 0.8px;
      transition: all 0.3s ease;
    }
    
    .button-container button:first-child {
      flex-grow: 1;
      box-shadow: 0 4px 12px rgba(26, 35, 126, 0.3);
    }
    
    .button-container button:first-child:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(26, 35, 126, 0.4);
    }
    
    .progress-bar {
      margin-top: 20px;
      border-radius: 4px;
      overflow: hidden;
    }
    
    /* Styles pour la section de confirmation */
    .success-step {
      text-align: center;
      margin-bottom: 20px;
      animation: fadeInUp 0.6s ease;
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .success-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #4caf50;
      margin-bottom: 10px;
    }
    
    .success-message {
      color: #4caf50;
      font-size: 18px;
      font-weight: 500;
    }
    
    /* Styles pour les exigences de mot de passe */
    .password-requirements {
      margin: 20px 0;
      padding: 15px;
      border-radius: 8px;
      background-color: #f5f7fa;
    }
    
    .requirement-title {
      font-size: 14px;
      margin-bottom: 10px;
      font-weight: 500;
      color: #546e7a;
    }
    
    .requirement {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
      color: #78909c;
      font-size: 14px;
      transition: color 0.3s ease;
    }
    
    .requirement mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 8px;
    }
    
    .requirement.met {
      color: #4caf50;
    }
    
    @media (max-width: 576px) {
      .reset-content {
        padding: 0 15px;
      }
      
      .button-container {
        flex-direction: column;
      }
      
      .button-container button {
        width: 100%;
      }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  otpForm: FormGroup;
  resetForm: FormGroup;
  
  showResetForm = false;
  isLoading = false;
  errorMessage = '';
  
  hidePassword = true;
  hideConfirmPassword = true;
  
  private identifier = '';
  private resetCode = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.otpForm = this.fb.group({
      identifier: ['', Validators.required],
      resetCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
    
  this.resetForm = this.fb.group({
    newPassword: ['', [
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/) // Au moins 1 majuscule, 1 minuscule et 1 chiffre
    ]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });
    
    // Si l'URL contient déjà des paramètres, les récupérer
    this.route.queryParams.subscribe(params => {
      const identifier = params['identifier'];
      const resetCode = params['code'];
      
      if (identifier) this.otpForm.patchValue({ identifier });
      if (resetCode) this.otpForm.patchValue({ resetCode });
      
      // Si les deux sont présents, vérifier automatiquement
      if (identifier && resetCode) {
        this.verifyOtp();
      }
    });
  }
    ngOnInit(): void {
    // Si l'utilisateur est déjà connecté, rediriger vers le tableau de bord
    if (this.authService.currentUser) {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // Récupérer l'identifiant depuis localStorage ou paramètre URL
    const savedIdentifier = localStorage.getItem('reset_identifier');
    if (savedIdentifier) {
      this.identifier = savedIdentifier;
      this.otpForm.patchValue({ identifier: savedIdentifier });
    } else if (!this.otpForm.get('identifier')?.value) {
      // Si aucun identifiant n'a été récupéré, définir "admin" par défaut
      this.identifier = 'admin';
      this.otpForm.patchValue({ identifier: 'admin' });
    }
    
    // Vérifier si un code est déjà présent (venant d'un paramètre d'URL)
    const resetCode = this.otpForm.get('resetCode')?.value;
    if (this.identifier && resetCode && resetCode.length === 6) {
      // Si les deux sont présents, vérifier automatiquement
      this.verifyOtp();
    }
  }
  
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
    verifyOtp(): void {
    if (this.otpForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const { identifier, resetCode } = this.otpForm.value;
    this.identifier = identifier;
    this.resetCode = resetCode;
    
    console.log('Tentative de vérification du code:', { identifier, resetCode });
    
    // Appel réel à l'API pour vérifier le code de réinitialisation
    this.authService.verifyResetCode(identifier, resetCode).subscribe({
      next: (response: { success: boolean; message: string }) => {
        this.isLoading = false;
        this.showResetForm = true;
        
        console.log('Code vérifié avec succès:', response);
        
        // Sauvegarder les valeurs pour les utiliser plus tard
        localStorage.setItem('reset_identifier', identifier);
        localStorage.setItem('reset_code', resetCode);
        
        if (response?.message) {
          this.snackBar.open(response.message, 'OK', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Erreur de vérification du code:', error);
        this.errorMessage = error.error?.message || 'Code de réinitialisation invalide ou expiré. Veuillez réessayer ou demander un nouveau code.';
      }
    });
  }
  resetPassword(): void {
    if (this.resetForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const { newPassword, confirmPassword } = this.resetForm.value;
    
    // Récupérer les informations de réinitialisation stockées
    const savedIdentifier = localStorage.getItem('reset_identifier');
    const savedResetCode = localStorage.getItem('reset_code');
    
    // Utiliser les valeurs stockées si les propriétés d'instance ne sont pas définies
    const identifier = this.identifier || savedIdentifier || '';
    const resetCode = this.resetCode || savedResetCode || '';
    
    if (!identifier || !resetCode) {
      this.errorMessage = 'Informations de réinitialisation manquantes. Veuillez recommencer le processus.';
      this.isLoading = false;
      return;
    }
    
    console.log('Tentative de réinitialisation du mot de passe pour:', identifier);
    
    this.authService.verifyPasswordReset({
      identifier: identifier,
      resetCode: resetCode,
      newPassword: newPassword,
      confirmPassword: confirmPassword
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Nettoyer le stockage local
        localStorage.removeItem('reset_identifier');
        localStorage.removeItem('reset_code');
        
        // Afficher un message de succès
        this.snackBar.open(response.message || 'Mot de passe réinitialisé avec succès!', 'OK', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        
        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erreur de réinitialisation du mot de passe:', error);
        
        if (error.error && typeof error.error === 'object') {
          // Extraire les messages d'erreur spécifiques s'ils existent
          const errorMessages = [];
          if (error.error.message) errorMessages.push(error.error.message);
          
          if (error.error.errors) {
            Object.keys(error.error.errors).forEach(key => {
              errorMessages.push(`${key}: ${error.error.errors[key]}`);
            });
          }
          
          this.errorMessage = errorMessages.join('. ') || 'Erreur lors de la réinitialisation du mot de passe.';
        } else {
          this.errorMessage = error.error?.message || 'Erreur lors de la réinitialisation du mot de passe.';
        }
      }
    });
  }
  
  // Helper methods for password validation in template
  hasMinLength(): boolean {
    const password = this.resetForm.get('newPassword')?.value;
    return password && password.length >= 8;
  }
  
  hasUpperCase(): boolean {
    const password = this.resetForm.get('newPassword')?.value;
    return password && /[A-Z]/.test(password);
  }
  
  hasLowerCase(): boolean {
    const password = this.resetForm.get('newPassword')?.value;
    return password && /[a-z]/.test(password);
  }
  
  hasDigit(): boolean {
    const password = this.resetForm.get('newPassword')?.value;
    return password && /[0-9]/.test(password);
  }

  resendResetCode(): void {
    if (!this.identifier) {
      this.identifier = this.otpForm.get('identifier')?.value || localStorage.getItem('reset_identifier') || '';
    }
    
    if (!this.identifier) {
      this.errorMessage = 'Aucun identifiant trouvé pour renvoyer le code';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.requestPasswordReset(this.identifier).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.snackBar.open(response.message || 'Un nouveau code a été envoyé à votre adresse email/téléphone', 'OK', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Erreur lors de l\'envoi du code. Veuillez réessayer.';
      }
    });
  }
}
