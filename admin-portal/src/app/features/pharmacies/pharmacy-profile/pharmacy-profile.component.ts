import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  licenseNumber: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  ownerName: string;
  ownerId: string;
  latitude: number;
  longitude: number;
  operatingHours: any;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  website?: string;
  specialties?: string[];
  acceptsInsurance: boolean;
  deliveryOptions: {
    delivery: boolean;
    pickup: boolean;
  };
  paymentMethods: {
    creditCard: boolean;
    bankTransfer: boolean;
    cash: boolean;
    insurance: boolean;
  };
}

@Component({
  selector: 'app-pharmacy-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    MatSlideToggleModule
  ],
  templateUrl: './pharmacy-profile.component.html',
  styleUrls: ['./pharmacy-profile.component.scss']
})
export class PharmacyProfileComponent implements OnInit {
  pharmacyId: string = '';
  pharmacy: Pharmacy | null = null;
  isLoading = false;
  
  generalForm!: FormGroup;
  contactForm!: FormGroup;
  operatingHoursForm!: FormGroup;
  settingsForm!: FormGroup;
  
  selectedLogo: File | null = null;
  selectedCover: File | null = null;
  
  logoPreview: string | null = null;
  coverPreview: string | null = null;
  
  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  specialties = [
    'Générale', 'Dermatologie', 'Pédiatrie', 'Gériatrie', 'Oncologie', 
    'Homéopathie', 'Orthopédie', 'Préparations magistrales', 'Vétérinaire'
  ];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.pharmacyId = params['id'];
      this.loadPharmacy();
    });
    
    this.initForms();
  }
  
  private initForms(): void {
    // General information form
    this.generalForm = this.fb.group({
      name: ['', [Validators.required]],
      licenseNumber: ['', [Validators.required]],
      description: [''],
      website: ['', [Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?')]],
      specialties: [[]],
    });
    
    // Contact information form
    this.contactForm = this.fb.group({
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['France', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]]
    });
    
    // Operating hours form
    this.operatingHoursForm = this.fb.group({});
    
    // Create form controls for each day
    for (const day of this.days) {
      this.operatingHoursForm.addControl(`${day}Opened`, this.fb.control(false));
      this.operatingHoursForm.addControl(`${day}Opening`, this.fb.control('09:00'));
      this.operatingHoursForm.addControl(`${day}Closing`, this.fb.control('18:00'));
      this.operatingHoursForm.addControl(`${day}LunchBreak`, this.fb.control(false));
      this.operatingHoursForm.addControl(`${day}LunchStart`, this.fb.control('12:00'));
      this.operatingHoursForm.addControl(`${day}LunchEnd`, this.fb.control('14:00'));
    }
    
    // Settings form
    this.settingsForm = this.fb.group({
      acceptsInsurance: [true],
      delivery: [true],
      pickup: [true],
      creditCard: [true],
      bankTransfer: [false],
      cash: [true],
      insurance: [true]
    });
  }
  
  loadPharmacy(): void {
    this.isLoading = true;
    this.http.get<Pharmacy>(`${environment.apiUrl}/v1/api/pharmacies/${this.pharmacyId}`).subscribe(
      (pharmacy) => {
        this.pharmacy = pharmacy;
        this.updateForms();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading pharmacy', error);
        this.snackBar.open('Erreur lors du chargement des informations de la pharmacie', 'Fermer', {
          duration: 5000
        });
        this.isLoading = false;
      }
    );
  }
  
  private updateForms(): void {
    if (!this.pharmacy) return;
    
    // Update general form
    this.generalForm.patchValue({
      name: this.pharmacy.name,
      licenseNumber: this.pharmacy.licenseNumber,
      description: this.pharmacy.description || '',
      website: this.pharmacy.website || '',
      specialties: this.pharmacy.specialties || []
    });
    
    // Update contact form
    this.contactForm.patchValue({
      address: this.pharmacy.address,
      city: this.pharmacy.city,
      postalCode: this.pharmacy.postalCode,
      country: this.pharmacy.country,
      phone: this.pharmacy.phone,
      email: this.pharmacy.email
    });
    
    // Update operating hours form
    if (this.pharmacy.operatingHours) {
      for (const day of this.days) {
        const dayHours = this.pharmacy.operatingHours[day];
        if (dayHours) {
          this.operatingHoursForm.patchValue({
            [`${day}Opened`]: dayHours.isOpen || false,
            [`${day}Opening`]: dayHours.open || '09:00',
            [`${day}Closing`]: dayHours.close || '18:00',
            [`${day}LunchBreak`]: dayHours.hasLunchBreak || false,
            [`${day}LunchStart`]: dayHours.lunchStart || '12:00',
            [`${day}LunchEnd`]: dayHours.lunchEnd || '14:00'
          });
        }
      }
    }
    
    // Update settings form
    this.settingsForm.patchValue({
      acceptsInsurance: this.pharmacy.acceptsInsurance,
      delivery: this.pharmacy.deliveryOptions?.delivery || false,
      pickup: this.pharmacy.deliveryOptions?.pickup || false,
      creditCard: this.pharmacy.paymentMethods?.creditCard || false,
      bankTransfer: this.pharmacy.paymentMethods?.bankTransfer || false,
      cash: this.pharmacy.paymentMethods?.cash || false,
      insurance: this.pharmacy.paymentMethods?.insurance || false
    });
    
    // Update image previews
    this.logoPreview = this.pharmacy.logoUrl || null;
    this.coverPreview = this.pharmacy.coverImageUrl || null;
  }
  
  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedLogo = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedLogo);
    }
  }
  
  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedCover = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.coverPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedCover);
    }
  }
  
  updateGeneral(): void {
    if (this.generalForm.invalid) return;
    
    const formData = new FormData();
    formData.append('name', this.generalForm.value.name);
    formData.append('licenseNumber', this.generalForm.value.licenseNumber);
    formData.append('description', this.generalForm.value.description);
    formData.append('website', this.generalForm.value.website);
    
    if (this.generalForm.value.specialties && this.generalForm.value.specialties.length > 0) {
      formData.append('specialties', JSON.stringify(this.generalForm.value.specialties));
    }
    
    if (this.selectedLogo) {
      formData.append('logo', this.selectedLogo);
    }
    
    if (this.selectedCover) {
      formData.append('coverImage', this.selectedCover);
    }
    
    this.http.patch<Pharmacy>(`${environment.apiUrl}/v1/api/pharmacies/${this.pharmacyId}`, formData).subscribe(
      (updatedPharmacy) => {
        this.pharmacy = updatedPharmacy;
        this.snackBar.open('Informations générales mises à jour avec succès', 'Fermer', {
          duration: 3000
        });
      },
      (error) => {
        console.error('Error updating pharmacy general info', error);
        this.snackBar.open('Erreur lors de la mise à jour des informations générales', 'Fermer', {
          duration: 5000
        });
      }
    );
  }
  
  updateContact(): void {
    if (this.contactForm.invalid) return;
    
    const contactData = {
      address: this.contactForm.value.address,
      city: this.contactForm.value.city,
      postalCode: this.contactForm.value.postalCode,
      country: this.contactForm.value.country,
      phone: this.contactForm.value.phone,
      email: this.contactForm.value.email
    };
    
    this.http.patch<Pharmacy>(`${environment.apiUrl}/v1/api/pharmacies/${this.pharmacyId}`, contactData).subscribe(
      (updatedPharmacy) => {
        this.pharmacy = updatedPharmacy;
        this.snackBar.open('Coordonnées mises à jour avec succès', 'Fermer', {
          duration: 3000
        });
      },
      (error) => {
        console.error('Error updating pharmacy contact info', error);
        this.snackBar.open('Erreur lors de la mise à jour des coordonnées', 'Fermer', {
          duration: 5000
        });
      }
    );
  }
  
  updateHours(): void {
    if (this.operatingHoursForm.invalid) return;
    
    // Convert form values to expected API format
    const operatingHours: any = {};
    
    for (const day of this.days) {
      operatingHours[day] = {
        isOpen: this.operatingHoursForm.value[`${day}Opened`],
        open: this.operatingHoursForm.value[`${day}Opening`],
        close: this.operatingHoursForm.value[`${day}Closing`],
        hasLunchBreak: this.operatingHoursForm.value[`${day}LunchBreak`],
        lunchStart: this.operatingHoursForm.value[`${day}LunchStart`],
        lunchEnd: this.operatingHoursForm.value[`${day}LunchEnd`]
      };
    }
    
    this.http.patch<Pharmacy>(`${environment.apiUrl}/v1/api/pharmacies/${this.pharmacyId}`, { operatingHours }).subscribe(
      (updatedPharmacy) => {
        this.pharmacy = updatedPharmacy;
        this.snackBar.open('Horaires d\'ouverture mis à jour avec succès', 'Fermer', {
          duration: 3000
        });
      },
      (error) => {
        console.error('Error updating pharmacy hours', error);
        this.snackBar.open('Erreur lors de la mise à jour des horaires d\'ouverture', 'Fermer', {
          duration: 5000
        });
      }
    );
  }
  
  updateSettings(): void {
    if (this.settingsForm.invalid) return;
    
    const settingsData = {
      acceptsInsurance: this.settingsForm.value.acceptsInsurance,
      deliveryOptions: {
        delivery: this.settingsForm.value.delivery,
        pickup: this.settingsForm.value.pickup
      },
      paymentMethods: {
        creditCard: this.settingsForm.value.creditCard,
        bankTransfer: this.settingsForm.value.bankTransfer,
        cash: this.settingsForm.value.cash,
        insurance: this.settingsForm.value.insurance
      }
    };
    
    this.http.patch<Pharmacy>(`${environment.apiUrl}/v1/api/pharmacies/${this.pharmacyId}`, settingsData).subscribe(
      (updatedPharmacy) => {
        this.pharmacy = updatedPharmacy;
        this.snackBar.open('Paramètres mis à jour avec succès', 'Fermer', {
          duration: 3000
        });
      },
      (error) => {
        console.error('Error updating pharmacy settings', error);
        this.snackBar.open('Erreur lors de la mise à jour des paramètres', 'Fermer', {
          duration: 5000
        });
      }
    );
  }
  
  getWeekdayName(day: string): string {
    const dayMap: {[key: string]: string} = {
      'monday': 'Lundi',
      'tuesday': 'Mardi',
      'wednesday': 'Mercredi',
      'thursday': 'Jeudi',
      'friday': 'Vendredi',
      'saturday': 'Samedi',
      'sunday': 'Dimanche'
    };
    return dayMap[day] || day;
  }
}
