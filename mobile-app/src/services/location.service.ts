import * as Location from 'expo-location';
import apiService from './api.service';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

class LocationService {
  private watchId: number | null = null;
  private isTracking: boolean = false;
  private currentDeliveryId: number | null = null;

  /**
   * Demander les permissions de géolocalisation
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission de géolocalisation refusée');
        return false;
      }

      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        console.log('Permission de géolocalisation en arrière-plan refusée');
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  }

  /**
   * Obtenir la position actuelle
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy || 0,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
      };
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la position:', error);
      return null;
    }
  }

  /**
   * Démarrer le suivi de position pour une livraison
   */
  async startLocationTracking(deliveryId: number): Promise<void> {
    if (this.isTracking) {
      await this.stopLocationTracking();
    }

    const hasPermission = await this.requestLocationPermissions();
    if (!hasPermission) {
      throw new Error('Permissions de géolocalisation requises');
    }

    this.currentDeliveryId = deliveryId;
    this.isTracking = true;

    // Suivi en temps réel toutes les 10 secondes
    this.watchId = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 secondes
        distanceInterval: 10, // 10 mètres
      },
      (location) => {
        this.handleLocationUpdate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy || 0,
          speed: location.coords.speed || 0,
          heading: location.coords.heading || 0,
        });
      }
    );
  }

  /**
   * Arrêter le suivi de position
   */
  async stopLocationTracking(): Promise<void> {
    if (this.watchId !== null) {
      this.watchId = null;
    }
    this.isTracking = false;
    this.currentDeliveryId = null;
  }

  /**
   * Gérer la mise à jour de position
   */
  private async handleLocationUpdate(locationData: LocationData): Promise<void> {
    if (!this.currentDeliveryId) return;

    try {
      await this.sendLocationToServer(this.currentDeliveryId, locationData);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la position:', error);
    }
  }

  /**
   * Envoyer la position au serveur
   */
  private async sendLocationToServer(deliveryId: number, locationData: LocationData): Promise<void> {
    try {
      await apiService.post('/location/update', {
        deliveryId,
        ...locationData,
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la position au serveur:', error);
      throw error;
    }
  }

  /**
   * Calculer la distance entre deux points
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  /**
   * Obtenir l'itinéraire entre deux points
   */
  async getRoute(startLat: number, startLon: number, endLat: number, endLon: number): Promise<any> {
    try {
      // Utilisation d'une API de routage (par exemple OpenRouteService ou Google Maps)
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=YOUR_API_KEY&start=${startLon},${startLat}&end=${endLon},${endLat}`
      );
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'obtention de l\'itinéraire:', error);
      throw error;
    }
  }
}

const locationService = new LocationService();
export default locationService;