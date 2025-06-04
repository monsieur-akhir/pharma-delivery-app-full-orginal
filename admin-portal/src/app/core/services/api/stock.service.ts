import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MedicineStock, StockAlert, StockMovement, StockChangeReason } from '../../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private baseUrl = `${environment.apiUrl}/v1/admin/stock`;

  constructor(private http: HttpClient) {}

  // Obtenir les stocks de médicaments pour une pharmacie
  getPharmacyStock(
    pharmacyId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
    category?: string,
    lowStock?: boolean
  ): Observable<{ stock: MedicineStock[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('pharmacyId', pharmacyId.toString());

    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);
    if (lowStock !== undefined) params = params.set('lowStock', lowStock.toString());

    return this.http.get<{ stock: MedicineStock[], total: number }>(`${this.baseUrl}`, { params });
  }

  // Obtenir les détails d'un stock spécifique
  getStockById(stockId: number): Observable<MedicineStock> {
    return this.http.get<MedicineStock>(`${this.baseUrl}/${stockId}`);
  }

  // Ajouter un nouveau médicament au stock d'une pharmacie
  addMedicineToStock(pharmacyId: number, medicineId: number, stockData: Partial<MedicineStock>): Observable<MedicineStock> {
    return this.http.post<MedicineStock>(`${this.baseUrl}/pharmacy/${pharmacyId}/medicine/${medicineId}`, stockData);
  }

  // Mettre à jour un stock existant
  updateStock(stockId: number, stockData: Partial<MedicineStock>): Observable<MedicineStock> {
    return this.http.patch<MedicineStock>(`${this.baseUrl}/${stockId}`, stockData);
  }

  // Supprimer un médicament du stock d'une pharmacie
  removeMedicineFromStock(stockId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${stockId}`);
  }

  // Ajuster la quantité d'un stock avec une raison
  adjustStockQuantity(
    stockId: number, 
    quantity: number, 
    reason: StockChangeReason,
    notes?: string
  ): Observable<StockMovement> {
    return this.http.post<StockMovement>(`${this.baseUrl}/${stockId}/adjust`, { 
      quantity, 
      reason, 
      notes 
    });
  }

  // Obtenir l'historique des mouvements pour un stock spécifique
  getStockMovements(
    stockId: number,
    page: number = 1,
    limit: number = 10
  ): Observable<{ movements: StockMovement[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{ movements: StockMovement[], total: number }>(`${this.baseUrl}/${stockId}/movements`, { params });
  }

  // Transférer du stock entre pharmacies
  transferStock(
    sourceStockId: number,
    destinationPharmacyId: number,
    quantity: number,
    notes?: string
  ): Observable<{ source: MedicineStock, destination: MedicineStock }> {
    return this.http.post<{ source: MedicineStock, destination: MedicineStock }>(
      `${this.baseUrl}/${sourceStockId}/transfer`,
      {
        destinationPharmacyId,
        quantity,
        notes
      }
    );
  }

  // Obtenir les alertes de stock pour une pharmacie (stock bas, expiré, etc.)
  getStockAlerts(pharmacyId: number): Observable<StockAlert[]> {
    return this.http.get<StockAlert[]>(`${this.baseUrl}/pharmacy/${pharmacyId}/alerts`);
  }

  // Obtenir toutes les alertes de stock (pour les admins)
  getAllStockAlerts(): Observable<StockAlert[]> {
    return this.http.get<StockAlert[]>(`${this.baseUrl}/alerts`);
  }

  // Générer un rapport de stock
  generateStockReport(pharmacyId: number, format: 'pdf' | 'csv' = 'pdf'): Observable<Blob> {
    let params = new HttpParams()
      .set('format', format)
      .set('pharmacyId', pharmacyId.toString());

    return this.http.get(`${this.baseUrl}/report`, {
      params,
      responseType: 'blob'
    });
  }
}
