import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Order } from '../../../shared/models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseUrl = `${environment.apiUrl}/v1/orders`;
  private deliveriesUrl = `${environment.apiUrl}/v1/deliveries`;

  constructor(private http: HttpClient) {}

  getOrders(page: number = 1, limit: number = 10, status?: string, pharmacyId?: string): Observable<{ orders: Order[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    if (pharmacyId) {
      params = params.set('pharmacyId', pharmacyId);
    }

    return this.http.get<{ orders: Order[], total: number }>(`${this.baseUrl}`, { params });
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${id}/status`, { status });
  }

  assignDeliveryPerson(orderId: string, userId: number): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${orderId}/assign-delivery`, { userId });
  }

  getOrdersForPharmacy(pharmacyId: string, page: number = 1, limit: number = 10, status?: string): Observable<{ orders: Order[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ orders: Order[], total: number }>(`${this.baseUrl}/pharmacy/${pharmacyId}`, { params });
  }

  getOrdersForUser(userId: string, page: number = 1, limit: number = 10): Observable<{ orders: Order[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{ orders: Order[], total: number }>(`${this.baseUrl}/user/${userId}`, { params });
  }

  /**
   * Récupère les livraisons actives
   * @param page Numéro de page
   * @param limit Nombre d'éléments par page
   * @param status Filtre par statut
   * @param query Texte de recherche
   */
  getActiveDeliveries(page: number = 1, limit: number = 10, status?: string, query?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    if (query) {
      params = params.set('query', query);
    }

    return this.http.get<any>(`${this.deliveriesUrl}/active`, { params });
  }

  /**
   * Récupère les livraisons terminées
   * @param page Numéro de page
   * @param limit Nombre d'éléments par page
   */
  getCompletedDeliveries(page: number = 1, limit: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.deliveriesUrl}/completed`, { params });
  }

  /**
   * Récupère les livraisons en attente
   * @param page Numéro de page
   * @param limit Nombre d'éléments par page
   */
  getPendingDeliveries(page: number = 1, limit: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.deliveriesUrl}/pending`, { params });
  }

  /**
   * Récupère les détails d'une livraison
   * @param id Identifiant de la livraison
   */
  getDeliveryDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.deliveriesUrl}/${id}`);
  }

  /**
   * Récupère les problèmes de livraison
   * @param page Numéro de page
   * @param limit Nombre d'éléments par page
   */
  getDeliveryIssues(page: number = 1, limit: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.deliveriesUrl}/issues`, { params });
  }

  /**
   * Récupère des statistiques sur les livraisons
   */
  getDeliveryAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.deliveriesUrl}/analytics`);
  }
}
