import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OtpDialogComponent } from '../otp-dialog/otp-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatDividerModule,
    MatCheckboxModule,
    MatDialogModule
  ],
  template: `
    <div class="login-container auth-page">
      <div class="login-content">
        <div class="login-form-container">
          <div class="logo-container">
            <img src="assets/logo.png" alt="Logo" class="login-logo">
            <h1 class="app-title">Pharmacy Admin Portal</h1>
          </div>
          
          <mat-card class="login-card">
            <mat-tab-group animationDuration="300ms">
              <mat-tab label="Connexion">
                <form [formGroup]="loginForm" (ngSubmit)="onLoginSubmit()" class="login-form">
                  <mat-card-content>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Identifiant / Email / Téléphone</mat-label>
                      <input matInput formControlName="identifier" placeholder="Entrez votre identifiant" required>
                      <mat-icon matPrefix>person</mat-icon>
                      <mat-error *ngIf="loginForm.get('identifier')?.hasError('required')">
                        L'identifiant est requis
                      </mat-error>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Mot de passe</mat-label>
                      <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Entrez votre mot de passe" required>
                      <mat-icon matPrefix>lock</mat-icon>
                      <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
                        <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                      </button>
                      <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                        Le mot de passe est requis
                      </mat-error>
                    </mat-form-field>
                    
                    <div class="form-actions">
                      <div class="remember-me">
                        <button mat-button color="primary">Se souvenir de moi</button>
                      </div>
                      <a (click)="showForgotPassword = true" class="forgot-password">Mot de passe oublié?</a>
                    </div>
                    
                    <div *ngIf="errorMessage" class="error-message">
                      <mat-icon>error</mat-icon>
                      <span>{{ errorMessage }}</span>
                    </div>
                  </mat-card-content>
                  
                  <mat-card-actions align="end">
                    <button mat-raised-button color="primary" type="submit" [disabled]="isLoading" class="submit-button">
                      <mat-icon *ngIf="!isLoading">login</mat-icon>
                      <span>Connexion</span>
                    </button>
                  </mat-card-actions>
                  
                  <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>
                </form>
              </mat-tab>
              
              <mat-tab label="Inscription">
                <form [formGroup]="registerForm" (ngSubmit)="onRegisterSubmit()" class="register-form">
                  <mat-card-content>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Prénom</mat-label>
                        <input matInput formControlName="firstName" placeholder="Entrez votre prénom" required>
                        <mat-icon matPrefix>person</mat-icon>
                        <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">
                          Le prénom est requis
                        </mat-error>
                      </mat-form-field>
                      
                      <mat-form-field appearance="outline">
                        <mat-label>Nom</mat-label>
                        <input matInput formControlName="lastName" placeholder="Entrez votre nom" required>
                        <mat-icon matPrefix>person</mat-icon>
                        <mat-error *ngIf="registerForm.get('lastName')?.hasError('required')">
                          Le nom est requis
                        </mat-error>
                      </mat-form-field>
                    </div>
                    
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Nom d'utilisateur</mat-label>
                      <input matInput formControlName="username" placeholder="Choisissez un nom d'utilisateur" required>
                      <mat-icon matPrefix>account_circle</mat-icon>
                      <mat-error *ngIf="registerForm.get('username')?.hasError('required')">
                        Le nom d'utilisateur est requis
                      </mat-error>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Email</mat-label>
                      <input matInput formControlName="email" placeholder="Entrez votre email" required type="email">
                      <mat-icon matPrefix>email</mat-icon>
                      <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                        L'email est requis
                      </mat-error>
                      <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                        L'email n'est pas valide
                      </mat-error>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Téléphone</mat-label>
                      <input matInput formControlName="phoneNumber" placeholder="Entrez votre numéro de téléphone">
                      <mat-icon matPrefix>phone</mat-icon>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Mot de passe</mat-label>
                      <input matInput [type]="hideRegisterPassword ? 'password' : 'text'" formControlName="password" placeholder="Créez un mot de passe" required>
                      <mat-icon matPrefix>lock</mat-icon>
                      <button type="button" mat-icon-button matSuffix (click)="hideRegisterPassword = !hideRegisterPassword">
                        <mat-icon>{{hideRegisterPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                      </button>
                      <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                        Le mot de passe est requis
                      </mat-error>
                      <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                        Le mot de passe doit contenir au moins 8 caractères
                      </mat-error>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Confirmer le mot de passe</mat-label>
                      <input matInput [type]="hideRegisterPassword ? 'password' : 'text'" formControlName="confirmPassword" placeholder="Confirmez votre mot de passe" required>
                      <mat-icon matPrefix>lock</mat-icon>
                      <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                        La confirmation du mot de passe est requise
                      </mat-error>
                      <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('passwordMismatch')">
                        Les mots de passe ne correspondent pas
                      </mat-error>
                    </mat-form-field>
                    
                    <div class="terms-privacy">
                      <div class="checkbox-alternative">
                        <input type="checkbox" formControlName="acceptTerms" id="acceptTerms" required>
                        <label for="acceptTerms">J'accepte les conditions d'utilisation et la politique de confidentialité</label>
                      </div>
                      <mat-error *ngIf="registerForm.get('acceptTerms')?.hasError('required') && registerForm.get('acceptTerms')?.touched">
                        Vous devez accepter les conditions
                      </mat-error>
                    </div>
                    
                    <div *ngIf="registerErrorMessage" class="error-message">
                      <mat-icon>error</mat-icon>
                      <span>{{ registerErrorMessage }}</span>
                    </div>
                  </mat-card-content>
                  
                  <mat-card-actions align="end">
                    <button mat-raised-button color="primary" type="submit" [disabled]="isRegisterLoading || !registerForm.valid" class="submit-button">
                      <mat-icon *ngIf="!isRegisterLoading">how_to_reg</mat-icon>
                      <span>S'inscrire</span>
                    </button>
                  </mat-card-actions>
                  
                  <mat-progress-bar *ngIf="isRegisterLoading" mode="indeterminate"></mat-progress-bar>
                </form>
              </mat-tab>
            </mat-tab-group>
          </mat-card>
          
          <div class="additional-options">
            <a href="#" class="help-link">Besoin d'aide?</a>
            <span class="separator">•</span>
            <a href="#" class="contact-link">Contactez-nous</a>
          </div>
        </div>
        
        <div class="login-hero">
          <div class="hero-content">
            <h2>Medi-Delivery</h2>
            <h3>Portail d'Administration des Pharmacies</h3>
            <p>Gérez efficacement vos pharmacies et médicaments, surveillez les livraisons et optimisez vos opérations avec notre plateforme d'administration avancée.</p>
            
            <div class="features">
              <div class="feature">
                <mat-icon>medication</mat-icon>
                <div class="feature-text">
                  <h4>Gestion des Médicaments</h4>
                  <p>Suivi des stocks et des prix</p>
                </div>
              </div>
              
              <div class="feature">
                <mat-icon>local_shipping</mat-icon>
                <div class="feature-text">
                  <h4>Suivi des Livraisons</h4>
                  <p>Localisation GPS en temps réel</p>
                </div>
              </div>
              
              <div class="feature">
                <mat-icon>analytics</mat-icon>
                <div class="feature-text">
                  <h4>Analyses et Statistiques</h4>
                  <p>Visualisations interactives avancées</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Forgot Password Dialog -->
      <div *ngIf="showForgotPassword" class="forgot-dialog-overlay">
        <mat-card class="forgot-dialog">
          <mat-card-header>
            <mat-card-title>Réinitialisation du mot de passe</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onForgotPasswordSubmit()">
              <p>Entrez votre identifiant, email ou numéro de téléphone. Nous vous enverrons un code de réinitialisation.</p>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Identifiant / Email / Téléphone</mat-label>
                <input matInput formControlName="identifier" placeholder="Entrez votre identifiant" required>
                <mat-icon matPrefix>person</mat-icon>
                <mat-error *ngIf="forgotPasswordForm.get('identifier')?.hasError('required')">
                  L'identifiant est requis
                </mat-error>
              </mat-form-field>
              
              <div class="option-buttons">
                <button mat-stroked-button type="button" (click)="showForgotPassword = false">Annuler</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="isPasswordResetLoading || !forgotPasswordForm.valid">
                  <span>Envoyer</span>
                </button>
              </div>
              
              <mat-progress-bar *ngIf="isPasswordResetLoading" mode="indeterminate"></mat-progress-bar>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f5f7fa;
      padding: 20px;
    }
    
    .login-content {
      display: flex;
      max-width: 1200px;
      width: 100%;
      height: 85vh;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
    }
    
    .login-form-container {
      flex: 1;
      padding: 40px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      margin-bottom: 30px;
    }
    
    .login-logo {
      width: 50px;
      height: 50px;
      margin-right: 16px;
    }
    
    .app-title {
      font-size: 24px;
      font-weight: 500;
      color: #2e3440;
      margin: 0;
    }
    
    .login-card {
      flex: 1;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    
    .login-form, .register-form {
      padding: 20px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .forgot-password {
      color: #2563eb;
      cursor: pointer;
      font-size: 14px;
    }
    
    .submit-button {
      min-width: 120px;
      margin-top: 16px;
    }
    
    .submit-button mat-icon {
      margin-right: 8px;
    }
    
    .terms-privacy {
      margin: 20px 0;
    }
    
    .additional-options {
      display: flex;
      justify-content: center;
      margin-top: 20px;
      font-size: 14px;
    }
    
    .help-link, .contact-link {
      color: #4c566a;
      text-decoration: none;
    }
    
    .separator {
      margin: 0 12px;
      color: #4c566a;
    }
    
    .login-hero {
      flex: 1;
      background: linear-gradient(135deg, #2563eb, #1e40af);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px;
    }
    
    .hero-content {
      max-width: 400px;
    }
    
    .hero-content h2 {
      font-size: 36px;
      font-weight: bold;
      margin: 0 0 8px 0;
    }
    
    .hero-content h3 {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 24px 0;
      opacity: 0.9;
    }
    
    .hero-content p {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 40px;
      opacity: 0.8;
    }
    
    .features {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .feature {
      display: flex;
      align-items: center;
    }
    
    .feature mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
      margin-right: 16px;
    }
    
    .feature-text h4 {
      font-size: 18px;
      margin: 0 0 4px 0;
    }
    
    .feature-text p {
      font-size: 14px;
      margin: 0;
      opacity: 0.7;
    }
    
    .error-message {
      background-color: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      padding: 8px 12px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      margin-top: 16px;
      font-size: 14px;
    }
    
    .error-message mat-icon {
      margin-right: 8px;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    /* Forgot Password Dialog */
    .forgot-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .forgot-dialog {
      width: 100%;
      max-width: 400px;
      border-radius: 12px;
    }
    
    .option-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }
    
    /* Responsive styles */
    @media (max-width: 992px) {
      .login-content {
        flex-direction: column;
        height: auto;
      }
      
      .login-hero {
        display: none;
      }
    }
    
    @media (max-width: 576px) {
      .login-form-container {
        padding: 20px;
      }
      
      .form-row {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotPasswordForm: FormGroup;
  
  hidePassword = true;
  hideRegisterPassword = true;
  showForgotPassword = false;
  
  isLoading = false;
  isRegisterLoading = false;
  isPasswordResetLoading = false;
  
  errorMessage = '';
  registerErrorMessage = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', Validators.required],
      password: ['', Validators.required]
    });
    
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
    
    this.forgotPasswordForm = this.fb.group({
      identifier: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    // If user is already logged in, redirect to dashboard
    if (this.authService.currentUser) {
      this.router.navigate(['/dashboard']);
    }
  }
  
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
  
  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const { identifier, password } = this.loginForm.value;
    
    this.authService.login({ identifier, password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          // Ouvrir la boîte de dialogue OTP
          this.openOtpDialog(response.username || identifier);
        } else {
          this.errorMessage = response.message || 'Une erreur est survenue lors de la connexion.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Identifiants incorrects. Veuillez réessayer.';
      }
    });
  }
  
  onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    
    this.isRegisterLoading = true;
    this.registerErrorMessage = '';
    
    const { firstName, lastName, username, email, phoneNumber, password } = this.registerForm.value;
    
    const userData = {
      firstName,
      lastName,
      username,
      email,
      phoneNumber,
      password,
      role: 'user',
      isActive: true
    };
    
    // Call API to register user
    this.isRegisterLoading = false;
    this.snackBar.open('Inscription réussie! Vous pouvez maintenant vous connecter.', 'Fermer', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
    
    // Reset form and switch to login tab
    this.registerForm.reset();
    this.registerForm.patchValue({ acceptTerms: false });
  }
  
  onForgotPasswordSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      return;
    }
    
    this.isPasswordResetLoading = true;
    
    const { identifier } = this.forgotPasswordForm.value;
    
    this.authService.requestPasswordReset(identifier).subscribe({
      next: (response) => {
        this.isPasswordResetLoading = false;
        this.showForgotPassword = false;
        
        // Stocker l'identifiant pour la réinitialisation ultérieure
        localStorage.setItem('reset_identifier', identifier);
        
        // Afficher un message de confirmation
        this.snackBar.open(response.message || 'Code de réinitialisation envoyé. Veuillez vérifier votre email ou SMS.', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        
        // Ouvrir la boîte de dialogue OTP pour la réinitialisation
        this.openPasswordResetOtpDialog(identifier);
        
        this.forgotPasswordForm.reset();
      },
      error: (error) => {
        this.isPasswordResetLoading = false;
        this.snackBar.open(error.error?.message || 'Erreur lors de la demande de réinitialisation. Veuillez réessayer.', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    });
  }
  
  /**
   * Ouvre la boîte de dialogue pour la vérification OTP
   */
  openOtpDialog(username: string): void {
    // Récupérer l'URL de retour depuis les paramètres de requête
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    
    const dialogRef = this.dialog.open(OtpDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { username, returnUrl }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.otp) {
        // Vérifier l'OTP
        this.verifyOtp(username, result.otp);
      } else if (result && result.resend) {
        // Gérer le renvoi d'OTP
        this.resendOtp(username);
      }
    });
  }

  /**
   * Vérifie le code OTP soumis
   */
  verifyOtp(username: string, otp: string): void {
    this.isLoading = true;
    
    this.authService.verifyOtp({ identifier: username, otp }).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.snackBar.open('Connexion réussie!', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        
        // Récupérer l'URL de retour depuis les paramètres de requête ou utiliser la route par défaut
        let returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        
        // Assurez-vous que l'URL commence par un slash
        if (!returnUrl.startsWith('/')) {
          returnUrl = '/' + returnUrl;
        }
        
        console.log('Login successful, redirecting to:', returnUrl);
        
        // Utilisation d'un timeout pour éviter des problèmes de navigation asynchrone
        setTimeout(() => {
          // Pour les routes internes, utiliser le routeur Angular
          this.router.navigateByUrl(returnUrl);
        }, 100);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Code OTP invalide. Veuillez réessayer.';
        
        // Rouvrir le dialogue OTP en cas d'erreur
        this.openOtpDialog(username);
      }
    });
  }

  /**
   * Renvoie un nouveau code OTP
   */
  resendOtp(identifier: string): void {
    this.authService.sendOtp({ identifier }).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Un nouveau code de vérification a été envoyé.', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        
        // Rouvrir le dialogue OTP pour la nouvelle saisie
        this.openOtpDialog(identifier);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de l\'envoi du nouveau code.';
        
        // Rouvrir le dialogue OTP même en cas d'erreur
        this.openOtpDialog(identifier);
      }
    });
  }

  /**
   * Ouvre la boîte de dialogue pour la vérification OTP lors de la réinitialisation de mot de passe
   */
  openPasswordResetOtpDialog(identifier: string): void {
    const dialogRef = this.dialog.open(OtpDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { 
        username: identifier,
        isPasswordReset: true,
        title: 'Réinitialisation de mot de passe',
        message: 'Veuillez entrer le code de réinitialisation que vous avez reçu par email ou SMS.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.otp) {
        // Rediriger vers la page de réinitialisation avec les paramètres
        this.router.navigate(['/reset-password'], {
          queryParams: {
            identifier: identifier,
            code: result.otp
          }
        });
      } else if (result && result.resend) {
        // Gérer le renvoi de code de réinitialisation
        this.resendResetCode(identifier);
      }
    });
  }

  /**
   * Renvoie un nouveau code de réinitialisation
   */
  resendResetCode(identifier: string): void {
    this.authService.requestPasswordReset(identifier).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Un nouveau code de réinitialisation a été envoyé.', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        
        // Rouvrir le dialogue OTP pour la nouvelle saisie
        this.openPasswordResetOtpDialog(identifier);
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Erreur lors de l\'envoi du nouveau code.';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        
        // Rouvrir le dialogue OTP même en cas d'erreur
        this.openPasswordResetOtpDialog(identifier);
      }
    });
  }
}