import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {  private apiUrl = '/v1/api/location';

  constructor(private http: HttpClient) {}
  /**
   * Récupère la position actuelle d'une livraison
   * @param deliveryId Identifiant de la livraison
   */
  getCurrentLocation(deliveryId: string): Observable<any> {
    if (!deliveryId) {
      throw new Error('deliveryId is required');
    }
    return this.http.get(`${this.apiUrl}/current/${deliveryId}`);
  }

  /**
   * Récupère l'historique des positions d'une livraison
   * @param deliveryId Identifiant de la livraison
   * @param limit Nombre maximum d'entrées à récupérer
   */
  getLocationHistory(deliveryId: string, limit: number = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}/history/${deliveryId}`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Calcule le temps estimé d'arrivée
   * @param deliveryId Identifiant de la livraison
   * @param destinationLat Latitude de la destination
   * @param destinationLng Longitude de la destination
   */
  getETA(deliveryId: string, destinationLat: number, destinationLng: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/eta/${deliveryId}`, {
      params: {
        destinationLat: destinationLat.toString(),
        destinationLng: destinationLng.toString()
      }
    });
  }

  /**
   * Recherche les livraisons à proximité d'un point
   * @param latitude Latitude du point central
   * @param longitude Longitude du point central
   * @param radius Rayon de recherche en kilomètres
   */
  getNearbyDeliveries(latitude: number, longitude: number, radius: number = 5): Observable<any> {
    return this.http.get(`${this.apiUrl}/nearby`, {
      params: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString()
      }
    });
  }
}
