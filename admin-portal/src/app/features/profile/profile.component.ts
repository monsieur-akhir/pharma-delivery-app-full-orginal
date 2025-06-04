import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, User } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

// Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';

interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  username: string;
  role: string;
  avatarUrl?: string;
  lastLogin?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDividerModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  securityForm!: FormGroup;
  
  userProfile: UserProfile | null = null;
  isLoading = true;
  isSaving = false;
  isChangingPassword = false;
  
  selectedFile: File | null = null;
  avatarPreview: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadUserProfile();
    this.initForms();
  }
  
  private initForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phoneNumber: ['', [Validators.pattern('^[0-9]{10}$')]]
    });
    
    this.securityForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  
  passwordMatchValidator(form: FormGroup): {[key: string]: boolean} | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      return { 'passwordMismatch': true };
    }
    return null;
  }
  
  loadUserProfile(): void {
    this.isLoading = true;
    
    // Use the auth service's current user or fetch from API
    if (this.authService.currentUser) {
      this.userProfile = {
        id: this.authService.currentUser.id,
        email: this.authService.currentUser.email,
        firstName: this.authService.currentUser.firstName,
        lastName: this.authService.currentUser.lastName,
        phoneNumber: this.authService.currentUser.phoneNumber,
        username: this.authService.currentUser.username,
        role: this.authService.currentUser.role,
        avatarUrl: this.authService.currentUser.avatarUrl,
        lastLogin: this.authService.currentUser.lastLogin,
        isActive: this.authService.currentUser.isActive
      };
      this.updateForms();
      this.isLoading = false;
    } else {
      this.http.get<UserProfile>(`${environment.apiUrl}/api/v1/admin/profile`).subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.updateForms();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading user profile', error);
          this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', {
            duration: 5000
          });
          this.isLoading = false;
        }
      });
    }
  }
  
  private updateForms(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        phoneNumber: this.userProfile.phoneNumber || ''
      });
      
      this.avatarPreview = this.userProfile.avatarUrl || null;
    }
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      
      // Preview the selected image
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
  
  updateProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSaving = true;
    
    const formData = new FormData();
    formData.append('firstName', this.profileForm.value.firstName);
    formData.append('lastName', this.profileForm.value.lastName);
    formData.append('phoneNumber', this.profileForm.value.phoneNumber || '');
    
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }
    
    this.http.patch<UserProfile>(`${environment.apiUrl}/api/v1/admin/profile`, formData).subscribe({
      next: (updatedProfile) => {
        this.userProfile = updatedProfile;
        // Also update the profile in auth service to keep it in sync
        if (this.authService.currentUser) {
          const updatedUser: User = {
            ...this.authService.currentUser,
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            phoneNumber: updatedProfile.phoneNumber,
            avatarUrl: updatedProfile.avatarUrl
          };
          this.authService.updateUserData(updatedUser);
        }
        
        this.snackBar.open('Profil mis à jour avec succès', 'Fermer', {
          duration: 3000
        });
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error updating profile', error);
        this.snackBar.open('Erreur lors de la mise à jour du profil', 'Fermer', {
          duration: 5000
        });
        this.isSaving = false;
      }
    });
  }
  
  updatePassword(): void {
    if (this.securityForm.invalid) return;
    this.isChangingPassword = true;
    
    const passwordData = {
      currentPassword: this.securityForm.value.currentPassword,
      newPassword: this.securityForm.value.newPassword,
      confirmPassword: this.securityForm.value.confirmPassword
    };
    
    this.http.post(`${environment.apiUrl}/api/v1/admin/change-password`, passwordData).subscribe({
      next: () => {
        this.snackBar.open('Mot de passe mis à jour avec succès', 'Fermer', {
          duration: 3000
        });
        this.securityForm.reset();
        this.isChangingPassword = false;
      },
      error: (error) => {
        console.error('Error changing password', error);
        this.snackBar.open(error.error?.message || 'Erreur lors du changement de mot de passe', 'Fermer', {
          duration: 5000
        });
        this.isChangingPassword = false;
      }
    });
  }
}
