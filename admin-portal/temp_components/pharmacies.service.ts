import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../admin-portal/src/environments/environment';

export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  city: string;
  status: string;
  ownerName: string;
  createdAt: string;
  medicineCount: number;
  staffCount: number;
  latitude?: number;
  longitude?: number;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  description?: string;
  websiteUrl?: string;
  country?: string;
  operatingHours?: string;
}

export interface PharmacyListItem {
  id: number;
  name: string;
  city: string;
  status: string;
  ownerName: string;
  createdAt: string;
  medicineCount: number;
  staffCount: number;
}

export interface PharmacyStats {
  totalSales: number;
  monthlySales: number;
  mostSoldMedicine: string;
  activeOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface PharmacyStaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  joinedDate: string;
  status: string;
}

export interface PharmacyListResponse {
  items: PharmacyListItem[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class PharmaciesService {
  private baseUrl = `${environment.apiUrl}/v1/pharmacies`;

  constructor(private http: HttpClient) {}

  getPharmacies(
    page: number = 0, 
    limit: number = 10, 
    sortField: string = 'createdAt', 
    sortOrder: 'asc' | 'desc' = 'desc',
    searchQuery: string = '',
    status?: string
  ): Observable<PharmacyListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortField', sortField)
      .set('sortOrder', sortOrder);

    if (searchQuery) {
      params = params.set('search', searchQuery);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PharmacyListResponse>(`${this.baseUrl}`, { params });
  }

  getPharmacyById(id: number): Observable<Pharmacy> {
    return this.http.get<Pharmacy>(`${this.baseUrl}/${id}`);
  }

  getPharmacyStats(id: number): Observable<PharmacyStats> {
    return this.http.get<PharmacyStats>(`${this.baseUrl}/${id}/stats`);
  }

  createPharmacy(pharmacy: Partial<Pharmacy>): Observable<Pharmacy> {
    return this.http.post<Pharmacy>(`${this.baseUrl}`, pharmacy);
  }

  updatePharmacy(id: number, pharmacy: Partial<Pharmacy>): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.baseUrl}/${id}`, pharmacy);
  }

  deletePharmacy(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  approvePharmacy(id: number): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.baseUrl}/${id}/approve`, {});
  }

  rejectPharmacy(id: number, reason: string): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.baseUrl}/${id}/reject`, { reason });
  }

  suspendPharmacy(id: number): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.baseUrl}/${id}/suspend`, {});
  }

  reactivatePharmacy(id: number): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.baseUrl}/${id}/reactivate`, {});
  }

  getPharmacyStaff(id: number): Observable<PharmacyStaffMember[]> {
    return this.http.get<PharmacyStaffMember[]>(`${this.baseUrl}/${id}/staff`);
  }
}
