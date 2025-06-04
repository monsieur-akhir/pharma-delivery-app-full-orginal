import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SupplierOrder } from '../../../shared/models/supplier-order.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierOrderService {  private baseUrl = `${environment.apiUrl}/v1/api/supplier-orders`;

  constructor(private http: HttpClient) {}

  getAllSupplierOrders(page: number = 1, limit: number = 10, status?: string): Observable<{ orders: SupplierOrder[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ orders: SupplierOrder[], total: number }>(`${this.baseUrl}`, { params });
  }

  getSupplierOrderById(id: string): Observable<SupplierOrder> {
    return this.http.get<SupplierOrder>(`${this.baseUrl}/${id}`);
  }

  getSupplierOrdersForPharmacy(pharmacyId: string, page: number = 1, limit: number = 10, status?: string): Observable<{ orders: SupplierOrder[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ orders: SupplierOrder[], total: number }>(`${this.baseUrl}/pharmacy/${pharmacyId}`, { params });
  }

  createSupplierOrder(order: Partial<SupplierOrder>): Observable<SupplierOrder> {
    return this.http.post<SupplierOrder>(`${this.baseUrl}`, order);
  }

  updateSupplierOrder(id: string, order: Partial<SupplierOrder>): Observable<SupplierOrder> {
    return this.http.patch<SupplierOrder>(`${this.baseUrl}/${id}`, order);
  }

  updateSupplierOrderStatus(id: string, status: string): Observable<SupplierOrder> {
    return this.http.patch<SupplierOrder>(`${this.baseUrl}/${id}/status`, { status });
  }

  deleteSupplierOrder(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  updateItemStatus(orderId: string, itemId: string, status: string, receivedQuantity?: number): Observable<SupplierOrder> {
    return this.http.patch<SupplierOrder>(
      `${this.baseUrl}/${orderId}/items/${itemId}`,
      { status, receivedQuantity }
    );
  }
}
