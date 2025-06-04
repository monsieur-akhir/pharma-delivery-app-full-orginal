import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  avatarUrl?: string;
  language: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule
  ],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent implements OnInit {
  profileForm!: FormGroup;
  securityForm!: FormGroup;
  notificationForm!: FormGroup;
  
  userProfile: UserProfile | null = null;
  isLoading = true;
  
  selectedFile: File | null = null;
  avatarPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
    this.initForms();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phoneNumber: ['', [Validators.pattern('^[0-9]{10}$')]],
      language: ['fr', [Validators.required]]
    });
    
    this.securityForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
    
    this.notificationForm = this.fb.group({
      emailNotifications: [true],
      pushNotifications: [true],
      smsNotifications: [false]
    });
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.http.get<UserProfile>(`${environment.apiUrl}/v1/api/admin/profile`).subscribe(
      (profile) => {
        this.userProfile = profile;
        this.updateForms();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading user profile', error);
        this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', {
          duration: 5000
        });
        this.isLoading = false;
      }
    );
  }
  
  private updateForms(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName,
        lastName: this.userProfile.lastName,
        phoneNumber: this.userProfile.phoneNumber,
        language: this.userProfile.language || 'fr'
      });
      
      this.notificationForm.patchValue({
        emailNotifications: this.userProfile.notificationPreferences?.email ?? true,
        pushNotifications: this.userProfile.notificationPreferences?.push ?? true,
        smsNotifications: this.userProfile.notificationPreferences?.sms ?? false
      });
      
      this.avatarPreview = this.userProfile.avatarUrl || null;
    }
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
  
  updateProfile(): void {
    if (this.profileForm.invalid) return;
    
    const formData = new FormData();
    formData.append('firstName', this.profileForm.value.firstName);
    formData.append('lastName', this.profileForm.value.lastName);
    formData.append('phoneNumber', this.profileForm.value.phoneNumber);
    formData.append('language', this.profileForm.value.language);
    
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }
    
    this.http.patch<UserProfile>(`${environment.apiUrl}/v1/api/admin/profile`, formData).subscribe(
      (updatedProfile) => {
        this.userProfile = updatedProfile;
        this.snackBar.open('Profil mis à jour avec succès', 'Fermer', {
          duration: 3000
        });
      },
      (error) => {
        console.error('Error updating profile', error);
        this.snackBar.open('Erreur lors de la mise à jour du profil', 'Fermer', {
          duration: 5000
        });
      }
    );
  }
  
  updatePassword(): void {
    if (this.securityForm.invalid) return;
    
    if (this.securityForm.value.newPassword !== this.securityForm.value.confirmPassword) {
      this.snackBar.open('Les mots de passe ne correspondent pas', 'Fermer', {
        duration: 5000
      });
      return;
    }
    
    const passwordData = {
      currentPassword: this.securityForm.value.currentPassword,
      newPassword: this.securityForm.value.newPassword
    };
    
    this.http.post(`${environment.apiUrl}/v1/api/admin/change-password`, passwordData).subscribe(
      () => {
        this.snackBar.open('Mot de passe mis à jour avec succès', 'Fermer', {
          duration: 3000
        });
        this.securityForm.reset();
      },
      (error) => {
        console.error('Error updating password', error);
        this.snackBar.open('Erreur lors de la mise à jour du mot de passe', 'Fermer', {
          duration: 5000
        });
      }
    );
  }
  
  updateNotificationPreferences(): void {
    if (this.notificationForm.invalid) return;
    
    const preferences = {
      notificationPreferences: {
        email: this.notificationForm.value.emailNotifications,
        push: this.notificationForm.value.pushNotifications,
        sms: this.notificationForm.value.smsNotifications
      }
    };
    
    this.http.patch<UserProfile>(`${environment.apiUrl}/v1/api/admin/notification-preferences`, preferences).subscribe(
      (updatedProfile) => {
        this.userProfile = updatedProfile;
        this.snackBar.open('Préférences de notification mises à jour avec succès', 'Fermer', {
          duration: 3000
        });
      },
      (error) => {
        console.error('Error updating notification preferences', error);
        this.snackBar.open('Erreur lors de la mise à jour des préférences de notification', 'Fermer', {
          duration: 5000
        });
      }
    );
  }
}
