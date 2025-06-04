import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  description: string;
  requires_prescription: boolean;
  price: number;
  stock: number;
}

export interface MedicineFilter {
  name?: string;
  category?: string;
  inStock?: boolean;
  pharmacyId?: number;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MedicineService {
  private baseUrl = `${environment.apiUrl}/v1/medicines`;

  constructor(private http: HttpClient) {}

  getMedicines(filter: MedicineFilter = {}): Observable<{ medicines: Medicine[], total: number }> {
    let params = new HttpParams();

    if (filter.name) params = params.set('name', filter.name);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.inStock !== undefined) params = params.set('inStock', filter.inStock.toString());
    if (filter.pharmacyId) params = params.set('pharmacyId', filter.pharmacyId.toString());
    if (filter.page) params = params.set('page', filter.page.toString());
    if (filter.limit) params = params.set('limit', filter.limit.toString());

    return this.http.get<{ medicines: Medicine[], total: number }>(this.baseUrl, { params });
  }

  getMedicineById(id: number): Observable<Medicine> {
    return this.http.get<Medicine>(`${this.baseUrl}/${id}`);
  }

  createMedicine(medicine: Partial<Medicine>): Observable<Medicine> {
    return this.http.post<Medicine>(this.baseUrl, medicine);
  }

  updateMedicine(id: number, medicine: Partial<Medicine>): Observable<Medicine> {
    return this.http.put<Medicine>(`${this.baseUrl}/${id}`, medicine);
  }

  deleteMedicine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/categories`);
  }

  getLowStock(): Observable<Medicine[]> {
    return this.http.get<Medicine[]>(`${this.baseUrl}/low-stock`);
  }

  updateStock(id: number, quantity: number, type: 'add' | 'remove' | 'set'): Observable<Medicine> {
    return this.http.post<Medicine>(`${this.baseUrl}/${id}/update-stock`, { quantity, type });
  }
}
