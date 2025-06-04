import apiService from './api.service';
import authService from './auth.service';

/**
 * Service de gestion des livraisons pour les coursiers
 */
class DeliveryService {
  /**
   * Récupère les livraisons assignées au coursier connecté
   */
  async getAssignedDeliveries(status?: string): Promise<any> {
    try {
      // Vérifier que l'utilisateur est un coursier
      if (!authService.isDeliveryPerson()) {
        throw new Error('Permissions insuffisantes: accès coursier requis');
      }
      
      const params = status ? { status } : {};
      const response = await apiService.get('/deliveries/assigned', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les détails d'une livraison
   */
  async getDeliveryDetails(deliveryId: number): Promise<any> {
    try {
      const response = await apiService.get(`/deliveries/${deliveryId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de la livraison #${deliveryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Mettre à jour le statut d'une livraison
   * @param deliveryId ID de la livraison
   * @param status Nouveau statut (en_cours, livré, etc.)
   * @param notes Notes optionnelles
   */
  async updateDeliveryStatus(deliveryId: number, status: string, notes?: string): Promise<any> {
    try {
      const response = await apiService.put(`/deliveries/${deliveryId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut de la livraison #${deliveryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Envoyer la position GPS actuelle pour le suivi de livraison
   */
  async updateLocationData(deliveryId: number, latitude: number, longitude: number): Promise<any> {
    try {
      const response = await apiService.post('/location/update', {
        deliveryId,
        latitude,
        longitude,
        timestamp: Date.now()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la position:', error);
      throw error;
    }
  }
  
  /**
   * Marquer une livraison comme complétée
   */
  async completeDelivery(deliveryId: number, signature?: string, photo?: string): Promise<any> {
    try {
      const data: any = { status: 'delivered' };
      
      if (signature) {
        data.signature = signature;
      }
      
      if (photo) {
        data.proofPhoto = photo;
      }
      
      const response = await apiService.put(`/deliveries/${deliveryId}/complete`, data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la complétion de la livraison #${deliveryId}:`, error);
      throw error;
    }
  }
}

const deliveryService = new DeliveryService();
export default deliveryService;
