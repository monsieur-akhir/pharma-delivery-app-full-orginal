import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Payment } from '../../../shared/models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {  private baseUrl = `${environment.apiUrl}/v1/api/payments`;

  constructor(private http: HttpClient) {}

  getAllPayments(page: number = 1, limit: number = 10, status?: string): Observable<{ payments: Payment[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ payments: Payment[], total: number }>(`${this.baseUrl}`, { params });
  }

  getPaymentById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${id}`);
  }

  getPaymentsForOrder(orderId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/order/${orderId}`);
  }

  getPaymentsForUser(userId: string, page: number = 1, limit: number = 10): Observable<{ payments: Payment[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{ payments: Payment[], total: number }>(`${this.baseUrl}/user/${userId}`, { params });
  }

  processRefund(paymentId: string, amount?: number): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/${paymentId}/refund`, { amount });
  }

  updatePaymentStatus(paymentId: string, status: string): Observable<Payment> {
    return this.http.patch<Payment>(`${this.baseUrl}/${paymentId}/status`, { status });
  }
}
