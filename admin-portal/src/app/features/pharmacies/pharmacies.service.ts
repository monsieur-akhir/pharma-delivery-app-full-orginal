import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Pharmacy {
  id: number;
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
  ownerId: number;
  latitude: number;
  longitude: number;
  operatingHours: string;
  createdAt: string;
  updatedAt: string;
  medicineCount?: number;
  staffCount?: number;
  websiteUrl?: string;
  description?: string;
}

export interface PharmacyListResponse {
  items: Pharmacy[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class PharmaciesService {
  private apiUrl = `${environment.apiUrl}/v1/pharmacies`;

  constructor(private http: HttpClient) { }

  /**
   * Gets a paginated list of pharmacies with optional filtering
   */
  getPharmacies(
    page: number = 0,
    limit: number = 10,
    sort: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
    search?: string,
    status?: string
  ): Observable<PharmacyListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sort', sort)
      .set('order', order);

    if (search) {
      params = params.set('search', search);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PharmacyListResponse>(this.apiUrl, { params });
  }

  /**
   * Get a single pharmacy by ID
   */
  getPharmacyById(id: number): Observable<Pharmacy> {
    return this.http.get<Pharmacy>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new pharmacy
   */
  createPharmacy(pharmacy: Partial<Pharmacy>): Observable<Pharmacy> {
    return this.http.post<Pharmacy>(this.apiUrl, pharmacy);
  }

  /**
   * Update an existing pharmacy
   */
  updatePharmacy(id: number, pharmacy: Partial<Pharmacy>): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.apiUrl}/${id}`, pharmacy);
  }

  /**
   * Delete a pharmacy
   */
  deletePharmacy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Approve a pharmacy
   */
  approvePharmacy(id: number): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.apiUrl}/${id}/approve`, {});
  }

  /**
   * Suspend a pharmacy
   */
  suspendPharmacy(id: number): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.apiUrl}/${id}/suspend`, {});
  }

  /**
   * Reject a pharmacy
   */
  rejectPharmacy(id: number, reason?: string): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /**
   * Get pharmacy statistics
   */
  getPharmacyStats(): Observable<{
    total: number;
    pending: number;
    approved: number;
    suspended: number;
    rejected: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}